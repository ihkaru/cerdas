
export interface ExpressionContext {
    row: Record<string, any>;
    user?: any;
    prelist?: any;
}

export function evaluate(code: string, context: ExpressionContext): any {
    try {
        // Simple sandboxing using 'with' block
        // Note: 'with' is strictly forbidden in strict mode, but new Function context is loose unless "use strict" is inside
        // However, TS compiles to strict.
        
        // Alternative: Replace variable names or use Proxy.
        // For MVP, we pass context keys as arguments.
        
        const keys = Object.keys(context);
        const values = Object.values(context);
        
        // "return " + code allows "row.age > 10" to be "return row.age > 10"
        // But code might be complex. Let's assume expressions are single value unless they contain 'return'
        
        const body = code.includes('return') ? code : `return ${code};`;
        
        // Function(arg1, arg2, ..., body)
        const fn = new Function(...keys, body);
        return fn(...values);
    } catch (e) {
        console.error(`Expression error: ${code}`, e);
        return null;
    }
}
