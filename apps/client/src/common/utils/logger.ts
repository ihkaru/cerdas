/**
 * Strategic Logging Service for Cerdas Client
 * 
 * Usage:
 * import { logger, useLogger } from '@/common/utils/logger';
 * 
 * // Global logger
 * logger.info('App started');
 * logger.debug('Debug info', { data: someData });
 * 
 * // Component-scoped logger
 * const log = useLogger('HomePage');
 * log.info('Page loaded');
 * log.error('Failed to load data', error);
 * 
 * // Access log buffer (for debug menu)
 * import { getLogBuffer } from '@/common/utils/logger';
 * const logs = getLogBuffer(); // returns last N entries
 */

export const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

interface LogConfig {
    level: LogLevel;
    enableTimestamp: boolean;
    enableStackTrace: boolean;
    prefix: string;
}

// --- In-Memory Log Buffer ---
// Always captures ALL entries regardless of console log level.
// This lets the debug menu show what happened even when console is quiet.
export interface LogEntry {
    time: string;       // HH:MM:SS.mmm
    level: string;      // DEBUG|INFO|WARN|ERROR
    context: string;    // Component/service name
    message: string;    // Log message
    data?: string;      // Serialized data (truncated)
}

const MAX_BUFFER_SIZE = 200;
const logBuffer: LogEntry[] = [];

/** Get the in-memory log buffer (newest last). */
export function getLogBuffer(): LogEntry[] {
    return logBuffer;
}

/** Clear the log buffer. */
export function clearLogBuffer(): void {
    logBuffer.length = 0;
}

function pushToBuffer(levelName: string, context: string, message: string, data?: unknown): void {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

    let dataStr: string | undefined;
    if (data !== undefined && data !== null) {
        if (data instanceof Error) {
            dataStr = `Error: ${data.message}`;
        } else if (typeof data === 'object') {
            try {
                const json = JSON.stringify(data);
                dataStr = json.length > 300 ? json.substring(0, 300) + '…' : json;
            } catch {
                dataStr = '[non-serializable]';
            }
        } else {
            dataStr = String(data).substring(0, 300);
        }
    }

    logBuffer.push({ time, level: levelName, context, message, data: dataStr });

    // Ring buffer: drop oldest when full
    if (logBuffer.length > MAX_BUFFER_SIZE) {
        logBuffer.shift();
    }
}

// Configuration - change this to control logging behavior
const config: LogConfig = {
    level: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN,  // Verbose in dev, quiet in prod
    enableTimestamp: true,
    enableStackTrace: true,
    prefix: '[CERDAS]'
};

// Set log level programmatically
export function setLogLevel(level: LogLevel): void {
    config.level = level;
}

// Get current log level
export function getLogLevel(): LogLevel {
    return config.level;
}

// Enable/disable verbose mode quickly
export function setVerbose(verbose: boolean): void {
    config.level = verbose ? LogLevel.DEBUG : LogLevel.WARN;
}

// Format the log message with context
function formatMessage(level: string, context: string, message: string): string {
    const parts: string[] = [];
    
    if (config.enableTimestamp) {
        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
        parts.push(`[${time}]`);
    }
    
    parts.push(config.prefix);
    parts.push(`[${level}]`);
    
    if (context) {
        parts.push(`[${context}]`);
    }
    
    parts.push(message);
    
    return parts.join(' ');
}

// Format data for logging (handles errors, objects, etc)
function formatData(data: unknown): string {
    if (data === undefined || data === null) {
        return '';
    }
    
    if (data instanceof Error) {
        let msg = `\n  Error: ${data.message}`;
        if (config.enableStackTrace && data.stack) {
            msg += `\n  Stack: ${data.stack}`;
        }
        return msg;
    }
    
    if (typeof data === 'object') {
        try {
            return `\n  Data: ${JSON.stringify(data, null, 2)}`;
        } catch {
            return `\n  Data: [Circular or non-serializable object]`;
        }
    }
    
    return `\n  Data: ${data}`;
}

// Core logging function
function log(level: LogLevel, levelName: string, context: string, message: string, data?: unknown): void {
    // ALWAYS push to buffer (regardless of log level filter)
    pushToBuffer(levelName, context, message, data);

    // Console output respects the configured level
    if (config.level > level) return;
    
    const formattedMsg = formatMessage(levelName, context, message);
    const dataStr = formatData(data);
    const fullMessage = formattedMsg + dataStr;
    
    switch (level) {
        case LogLevel.DEBUG:
            console.log(fullMessage);
            break;
        case LogLevel.INFO:
            console.info(fullMessage);
            break;
        case LogLevel.WARN:
            console.warn(fullMessage);
            break;
        case LogLevel.ERROR:
            console.error(fullMessage);
            break;
    }
}

// Logger interface
interface Logger {
    debug: (message: string, data?: unknown) => void;
    info: (message: string, data?: unknown) => void;
    warn: (message: string, data?: unknown) => void;
    error: (message: string, data?: unknown) => void;
    
    // Utility methods
    group: (label: string) => void;
    groupEnd: () => void;
    table: (data: unknown) => void;
    time: (label: string) => void;
    timeEnd: (label: string) => void;
}

// Create a scoped logger for a specific context (page/component/service)
export function useLogger(context: string): Logger {
    return {
        debug: (message: string, data?: unknown) => log(LogLevel.DEBUG, 'DEBUG', context, message, data),
        info: (message: string, data?: unknown) => log(LogLevel.INFO, 'INFO', context, message, data),
        warn: (message: string, data?: unknown) => log(LogLevel.WARN, 'WARN', context, message, data),
        error: (message: string, data?: unknown) => log(LogLevel.ERROR, 'ERROR', context, message, data),
        
        group: (label: string) => {
            if (config.level <= LogLevel.DEBUG) console.group(`${config.prefix} [${context}] ${label}`);
        },
        groupEnd: () => {
            if (config.level <= LogLevel.DEBUG) console.groupEnd();
        },
        table: (data: unknown) => {
            if (config.level <= LogLevel.DEBUG) console.table(data);
        },
        time: (label: string) => {
            if (config.level <= LogLevel.DEBUG) console.time(`${config.prefix} [${context}] ${label}`);
        },
        timeEnd: (label: string) => {
            if (config.level <= LogLevel.DEBUG) console.timeEnd(`${config.prefix} [${context}] ${label}`);
        }
    };
}

// Global logger (no specific context)
export const logger: Logger = useLogger('App');

// Export for convenience
export default logger;

