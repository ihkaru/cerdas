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
function formatData(data: any): string {
    if (data === undefined || data === null) {
        return '';
    }
    
    if (data instanceof Error) {
        return `\n  Error: ${data.message}${config.enableStackTrace && data.stack ? `\n  Stack: ${data.stack}` : ''}`;
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
function log(level: LogLevel, levelName: string, context: string, message: string, data?: any): void {
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
    debug: (message: string, data?: any) => void;
    info: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
    error: (message: string, data?: any) => void;
    
    // Utility methods
    group: (label: string) => void;
    groupEnd: () => void;
    table: (data: any) => void;
    time: (label: string) => void;
    timeEnd: (label: string) => void;
}

// Create a scoped logger for a specific context (page/component/service)
export function useLogger(context: string): Logger {
    return {
        debug: (message: string, data?: any) => log(LogLevel.DEBUG, 'DEBUG', context, message, data),
        info: (message: string, data?: any) => log(LogLevel.INFO, 'INFO', context, message, data),
        warn: (message: string, data?: any) => log(LogLevel.WARN, 'WARN', context, message, data),
        error: (message: string, data?: any) => log(LogLevel.ERROR, 'ERROR', context, message, data),
        
        group: (label: string) => {
            if (config.level <= LogLevel.DEBUG) console.group(`${config.prefix} [${context}] ${label}`);
        },
        groupEnd: () => {
            if (config.level <= LogLevel.DEBUG) console.groupEnd();
        },
        table: (data: any) => {
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
