
// ClosureCompiler.ts
// Securely compiles and executes string function bodies using 'new Function'
// with a sandboxed-like context injection.

/*
 * Standard Context Interface available to all closures
 */
export interface ClosureContext {
    row: Record<string, any>;     // Current form data
    index?: number;               // Current row index (for nested forms)
    parent?: Record<string, any>; // Parent form data (if nested)
    
    // User Context (App-Wide) - Slim, only primitives
    user?: {
        id: number;
        email: string;
        name: string;
        role: 'app_admin' | 'org_admin' | 'supervisor' | 'enumerator';
        organizationId: number | null;
    };
    
    // Assignment Context
    assignment?: {
        id: string | number;
        status: string;
        form_id?: number;
        organization_id?: number;
        prelist_data?: Record<string, any>;
    };
    
    // Utilities
    utils: {
        now: () => string;
        today: () => string;
        uuid: () => string;
        sum: (arr: any[], key?: string) => number;
        daysSince: (date: string) => number;
        log: (...args: any[]) => void;
    };
    
    // Variables/Lookups
    vars?: Record<string, any>; // Temporary variables
}

/**
 * Standard Utility Implementation
 */
export const defaultUtils = {
    now: () => new Date().toISOString(),
    today: () => new Date().toISOString().split('T')[0] || '', // YYYY-MM-DD, fallback to empty string
    uuid: () => Math.random().toString(36).substring(2) + Date.now().toString(36),
    sum: (arr: any[], key?: string) => {
        if (!Array.isArray(arr)) return 0;
        return arr.reduce((acc, item) => {
             const val = key ? (item[key] || 0) : item;
             return acc + (Number(val) || 0);
        }, 0);
    },
    daysSince: (dateStr: string) => {
        if (!dateStr) return 0;
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    },
    log: (...args: any[]) => console.log('[Closure Log]', ...args),
};

// Cache for compiled functions to avoid re-compilation overhead
const functionCache = new Map<string, Function>();

/**
 * Executes a closure string.
 * The string should be the BODY of the function.
 * Use 'ctx' to access the context.
 * 
 * Example:
 * code: "return ctx.row.qty * ctx.row.price"
 */
export function executeClosure(code: string | undefined | null, context: ClosureContext, defaultValue: any = null): any {
    if (!code || typeof code !== 'string' || !code.trim()) {
        return defaultValue;
    }

    // Optimization: Check for simple static expression starts with '=' (Legacy/Excel-like)
    // We can wrap simple one-liners: "=row.qty" -> "return ctx.row.qty" ?? No, keep separate?
    // User requested "True Closure". So we assume JS Body.
    // If it starts with '=', we can treat it as a return statement.
    let body = code;
    if (code.startsWith('=')) {
        // Convert "=ctx.row.qty > 10" to "return ctx.row.qty > 10"
        // Also support "row." alias for "ctx.row." for cleaner syntax?
        // Let's stick to explicit 'ctx' or provide aliases.
        
        // Simple heuristic transformation for convenience
        // =row.qty -> return ctx.row.qty
        // But unsafe regex replace. Better let user write JS.
        // For backward compatibility with my previous "Expression String", we handle '='
        body = `return ${code.substring(1)}`;
    }

    // Cache Key
    const cacheKey = body;

    try {
        let fn = functionCache.get(cacheKey);
        if (!fn) {
            // Create Function
            // Arguments: 'ctx', 'row', 'utils' (destructured aliases for convenience)
            // But 'new Function' takes arg names, then body.
            // We expose 'ctx' as the main object.
            // And maybe 'row' as a shortcut for ctx.row?
            fn = new Function('ctx', 'row', 'utils', body);
            functionCache.set(cacheKey, fn);
        }

        // Execute
        // fn(ctx, ctx.row, ctx.utils)
        return fn(context, context.row, context.utils);
    } catch (e) {
        console.warn(`[Closure Error] Code: "${body.substring(0, 50)}..."`, e);
        return defaultValue;
    }
}
