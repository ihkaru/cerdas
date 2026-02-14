
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { useLogger } from '../utils/logger';
import { APPS_TABLE, ASSIGNMENTS_TABLE, RESPONSES_TABLE, SCHEMA_VERSION, SYNC_QUEUE_TABLE, TABLE_VERSIONS_TABLE, TABLES_TABLE } from './schema';

const log = useLogger('DatabaseService');

export class DatabaseService {
    private sqlite: SQLiteConnection;
    private dbName = 'cerdas_db';
    private db: SQLiteDBConnection | null = null;

    constructor() {
        this.sqlite = new SQLiteConnection(CapacitorSQLite);
    }

    private initPromise: Promise<void> | null = null;

    async init(): Promise<void> {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this.initializeDatabase();
        
        try {
            await this.initPromise;
        } catch (e) {
            this.initPromise = null; // Reset on failure so we can try again
            throw e;
        }
    }

    private isWebStoreInitialized = false;

    private async initializeDatabase(): Promise<void> {
        const platform = Capacitor.getPlatform();
        
        // 1. Web-specific initialization
        if (platform === 'web' && !this.isWebStoreInitialized) {
            log.debug('Initializing Web Store...');
            const jeepEl = document.querySelector('jeep-sqlite');
            
            if (!jeepEl) {
                // Should be in index.html, but if not, warn
                log.warn('jeep-sqlite element missing from DOM. Verify index.html');
            }
            
            await customElements.whenDefined('jeep-sqlite');
            
            try {
                await this.sqlite.initWebStore();
                this.isWebStoreInitialized = true;
                log.debug('Web Store initialized');
            } catch (err: any) {
                log.error('Failed to initialize Web Store', err);
                // Continue, might succeed on retry in createConnection
            }
        }

        // 2. Establish Connection
        try {
            const isConn = await this.sqlite.isConnection(this.dbName, false);
            
            if (isConn.result) {
                this.db = await this.sqlite.retrieveConnection(this.dbName, false);
                log.debug('Retrieved existing connection');
            } else {
                this.db = await this.createConnectionWithRetry();
                log.debug('Created new connection');
            }

            if (!this.db) throw new Error('Database connection object is null');

            // 3. Open Database
            const isOpen = await this.db.isDBOpen();
            if (!isOpen.result) {
                await this.db.open();
                log.debug('Database opened');
            }

            // 4. Initialize Schema
            await this.createTables();
            log.info('Database initialized successfully');

            // 5. Save to Store (Web only)
            if (platform === 'web') {
                try {
                    await this.sqlite.saveToStore(this.dbName);
                } catch (e) {
                    log.warn('Failed to save to store', e);
                }
            }

        } catch (err: any) {
            log.error('Critical Database Initialization Error', err);
            throw err;
        }
    }

    private async createConnectionWithRetry(): Promise<SQLiteDBConnection> {
        let retries = 3;
        let lastError: any;

        while (retries > 0) {
            try {
                return await this.sqlite.createConnection(this.dbName, false, 'no-encryption', 1, false);
            } catch (err: any) {
                lastError = err;
                
                // Specific handling for "WebStore is not open" on Web
                if (Capacitor.getPlatform() === 'web' && err.message?.includes('WebStore is not open')) {
                    retries--;
                    log.warn(`WebStore not open, retrying initialization... (${retries} retries left)`);
                    
                    // Wait a bit
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Try initializing store again
                    try {
                        await this.sqlite.initWebStore();
                        this.isWebStoreInitialized = true;
                    } catch (storeErr) {
                        log.warn('Retry initWebStore failed', storeErr);
                    }
                    
                    continue;
                }
                
                // For other errors, just throw immediately
                throw err;
            }
        }
        
        throw lastError;
    }

    private async createTables(): Promise<void> {
        if (!this.db) return;

        // Check schema version for migrations
        const storedVersionStr = localStorage.getItem('db_schema_version');
        const storedVersion = parseInt(storedVersionStr || '0', 10);
        const currentVersion = SCHEMA_VERSION;
        
        log.info(`[Schema Check] Stored: ${storedVersion} (raw: "${storedVersionStr}") | Code: ${currentVersion}`);
        
        if (storedVersion < currentVersion) {
            log.warn(`[UUID Migration] Schema outdated! Dropping all tables... (${storedVersion} → ${currentVersion})`);
            
            // Drop and recreate tables (development approach - preserves no data)
            // In production, use proper ALTER TABLE statements
            const dropStatements = [
                'DROP TABLE IF EXISTS tables', // Renamed
                'DROP TABLE IF EXISTS forms', // Cleanup old
                'DROP TABLE IF EXISTS apps',
                'DROP TABLE IF EXISTS app_schemas',
                'DROP TABLE IF EXISTS assignments', 
                'DROP TABLE IF EXISTS responses',
                'DROP TABLE IF EXISTS sync_queue',
                'DROP TABLE IF EXISTS table_versions'
            ];
            
            for (const sql of dropStatements) {
                try {
                    await this.db.execute(sql);
                    log.debug(`[Migration] Dropped: ${sql.split(' ')[4]}`);
                } catch (e) {
                    log.warn(`Drop table statement failed: ${sql}`, e);
                }
            }
            log.info('[UUID Migration] All old tables dropped successfully');
        } else {
            log.debug(`[Schema Check] Version OK (${storedVersion}), skipping migration`);
        }

        // Create tables
        const tables = [
            TABLES_TABLE, // Renamed
            APPS_TABLE,
            ASSIGNMENTS_TABLE,
            RESPONSES_TABLE,
            SYNC_QUEUE_TABLE,
            TABLE_VERSIONS_TABLE
        ];

        for (const sql of tables) {
            await this.db.execute(sql);
        }
        
        // Store current version
        localStorage.setItem('db_schema_version', currentVersion.toString());
        log.debug('Schema version stored:', currentVersion);
    }

    async getDB(): Promise<SQLiteDBConnection> {
        // Initialize DB if not exists
        if (!this.db) {
            await this.init();
        }
        
        // Double check after init
        if (!this.db) {
            throw new Error('Database initialization failed');
        }
        
        return this.db;
    }

    async save(): Promise<void> {
        if (Capacitor.getPlatform() === 'web') {
            try {
                await this.sqlite.saveToStore(this.dbName);
                log.debug('Database saved to Web Store');
            } catch (e) {
                log.warn('Failed to save to Web Store', e);
            }
        }
    }

    async resetDatabase(): Promise<void> {
        if (!this.db) {
            await this.init();
        }
        
        log.warn('Resetting database...');

        // 1. Drop Tables
        const dropStatements = [
            'DROP TABLE IF EXISTS tables', // Renamed
            'DROP TABLE IF EXISTS forms',
            'DROP TABLE IF EXISTS apps', 
            'DROP TABLE IF EXISTS app_schemas',
            'DROP TABLE IF EXISTS assignments', 
            'DROP TABLE IF EXISTS responses',
            'DROP TABLE IF EXISTS sync_queue',
            'DROP TABLE IF EXISTS table_versions'
        ];
        
        if (this.db) {
             for (const sql of dropStatements) {
                try {
                    await this.db.execute(sql);
                } catch (e) {
                    log.warn(`Drop table statement failed: ${sql}`, e);
                }
            }
        }
       
        // 2. Clear Local Storage flags
        localStorage.removeItem('db_schema_version');
        localStorage.removeItem('dashboard_stats');
        localStorage.removeItem('app_pending_counts');
        
        // 3. Persist Empty State (Web)
        await this.save();
        
        log.info('Database reset complete.');
    }
}


export const databaseService = new DatabaseService();
