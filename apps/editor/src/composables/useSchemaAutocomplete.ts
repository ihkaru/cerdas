import { autocompletion, type CompletionContext, type Completion } from '@codemirror/autocomplete';
import { type Extension } from '@codemirror/state';

export interface SchemaField {
    id: string;
    name: string;
    label: string;
    type: string;
}

/**
 * Creates a schema-aware completion source for CodeMirror 6.
 * Provides context-aware suggestions when the user types `row.`, `data.`, or `item.` 
 */
function buildSchemaCompletions(fields: SchemaField[]) {
    // Common icons for types
    const TYPE_ICONS: Record<string, string> = {
        text: '📝',
        number: '🔢',
        date: '📅',
        image: '🖼️',
        gps: '📍',
        select: '📋',
        checkbox: '☑️',
        textarea: '📄',
    };

    // Build completions for row.* / data.* fields
    const fieldCompletions: Completion[] = fields.map((f) => ({
        label: f.name,
        displayLabel: `${f.name} (${f.label})`,
        type: f.type === 'number' ? 'variable' : 'property',
        detail: `${TYPE_ICONS[f.type] || '•'} ${f.type} — "${f.label}"`,
        boost: 10, // Prioritize schema fields
    }));

    // row.* snippets for common patterns
    const rowSnippets: Completion[] = fields.map((f) => ({
        label: `row.${f.name}`,
        displayLabel: `row.${f.name}`,
        type: f.type === 'number' ? 'variable' : 'property',
        detail: `${TYPE_ICONS[f.type] || '•'} ${f.type} — "${f.label}"`,
        boost: 5,
    }));

    // Static context-level completions
    const contextCompletions: Completion[] = [
        { label: 'row', detail: '🗂️ Row data object — all field values', type: 'namespace', boost: 20 },
        { label: 'data', detail: '🗂️ Alias for row (same as row)', type: 'namespace', boost: 18 },
        { label: 'ctx', detail: '📦 Context object (ctx.row, ctx.items, ctx.cache)', type: 'namespace', boost: 20 },
        { label: 'ctx.row', detail: '🗂️ Row data (all field values)', type: 'namespace', boost: 18 },
        { label: 'ctx.items', detail: '📦 Array of all data in map', type: 'property', boost: 14 },
        { label: 'ctx.cache', detail: '💾 Shared JS object for caching', type: 'property', boost: 12 },
        { label: 'ctx.user', detail: '👤 Current user info', type: 'namespace', boost: 12 },
        { label: 'ctx.user.id', detail: '🆔 Current user UUID', type: 'property', boost: 8 },
        { label: 'ctx.user.name', detail: '👤 Current user display name', type: 'property', boost: 8 },
        { label: 'ctx.user.role', detail: '🎭 Current user role', type: 'property', boost: 8 },
        { label: 'item', detail: '📦 Full assignment object (id, status, dates...)', type: 'namespace', boost: 15 },
        { label: 'item.id', detail: '🆔 Assignment UUID', type: 'property', boost: 8 },
        { label: 'item.status', detail: '📊 Assignment status string', type: 'property', boost: 8 },
        { label: 'item.local_id', detail: '🔑 Local SQLite ID', type: 'property', boost: 6 },
        { label: 'item.created_at', detail: '🕐 Creation timestamp', type: 'property', boost: 5 },
        { label: 'item.updated_at', detail: '🕐 Update timestamp', type: 'property', boost: 5 },
    ];

    // Marker style object completions
    const markerStyleSnippets: Completion[] = [
        {
            label: "return { color: 'orange', icon: 'circle' }",
            displayLabel: 'return { color, icon }',
            type: 'function',
            detail: '🎨 Basic static style',
        },
        {
            label: "if (row.status === '') {\n  return { color: 'green', icon: 'check' };\n}\nreturn { color: 'orange', icon: 'circle' };",
            displayLabel: 'if → return color/icon',
            type: 'function',
            detail: '🔀 Conditional style',
        },
    ];

    /* eslint-disable-next-line sonarjs/cognitive-complexity */
    return (context: CompletionContext) => {
        const { pos, state } = context;
        const textBefore = state.sliceDoc(0, pos);

        // ------------------------------------------------------------------
        // Priority 1: row. / data. / ctx.row. → show field name completions
        // ------------------------------------------------------------------
        const rowDotMatch = textBefore.match(/(?:row|data|ctx\.row)\.(\w*)$/);
        if (rowDotMatch) {
            const prefix = rowDotMatch[1] || '';
            const from = pos - prefix.length;
            const filtered = prefix
                ? fieldCompletions.filter(c => c.label.toLowerCase().startsWith(prefix.toLowerCase()))
                : fieldCompletions;

            if (filtered.length > 0 || !prefix) {
                return {
                    from,
                    options: filtered.length ? filtered : fieldCompletions,
                    validFor: /^\w*$/,
                };
            }
        }

        // ------------------------------------------------------------------
        // Priority 2: item. → show item properties
        // ------------------------------------------------------------------
        const itemDotMatch = textBefore.match(/item\.(\w*)$/);
        if (itemDotMatch) {
            const prefix = itemDotMatch[1] || '';
            const from = pos - prefix.length;
            const itemProps = contextCompletions.filter(c => c.label.startsWith('item.'));
            const itemFieldProps = itemProps.map(c => ({ ...c, label: c.label.replace('item.', '') }));
            const filtered = prefix
                ? itemFieldProps.filter(c => c.label.toLowerCase().startsWith(prefix.toLowerCase()))
                : itemFieldProps;

            return {
                from,
                options: filtered.length ? filtered : itemFieldProps,
                validFor: /^\w*$/,
            };
        }

        // ------------------------------------------------------------------
        // Priority 3: ctx. → show ctx sub-properties
        // ------------------------------------------------------------------
        const ctxDotMatch = textBefore.match(/ctx\.(\w*)$/);
        if (ctxDotMatch) {
            const prefix = ctxDotMatch[1] || '';
            const from = pos - prefix.length;
            const ctxProps: Completion[] = [
                { label: 'row', detail: '🗂️ Row field values', type: 'namespace', boost: 20 },
                { label: 'user', detail: '👤 Current user', type: 'namespace', boost: 15 },
                { label: 'user.role', detail: '🎭 User role (supervisor, enum, etc)', type: 'property', boost: 14 },
                { label: 'app', detail: '📱 App metadata', type: 'namespace', boost: 10 },
                { label: 'app.mode', detail: '⚙️ simple or complex', type: 'property', boost: 8 },
                { label: 'params', detail: '📋 Route parameters', type: 'namespace', boost: 10 },
                { label: 'items', detail: '📦 Array of all data in map', type: 'property', boost: 12 },
                { label: 'cache', detail: '💾 Shared object `{}` across current render cycle', type: 'property', boost: 8 },
                { label: 'parentRow', detail: '🔝 (Nested Form) Immediate parent record', type: 'namespace', boost: 14 },
                { label: 'parents', detail: '📚 (Deep Nesting) Array of all parent records', type: 'property', boost: 12 },
                { label: 'rowIndex', detail: '🔢 (Nested Form) Current list index', type: 'property', boost: 12 },
                { label: 'allRows', detail: '📦 (Nested Form) Array of all siblings', type: 'property', boost: 12 },
            ];
            const filtered = prefix
                ? ctxProps.filter(c => c.label.toLowerCase().startsWith(prefix.toLowerCase()))
                : ctxProps;

            return {
                from,
                options: filtered,
                validFor: /^\w*$/,
            };
        }

        // ------------------------------------------------------------------
        // Priority 3: Explicit trigger or word context → show top-level hints
        // ------------------------------------------------------------------
        const word = context.matchBefore(/\w*/);
        if (!word || (word.from === word.to && !context.explicit)) return null;

        // Show everything at top level
        const allOptions: Completion[] = [
            ...contextCompletions,
            ...rowSnippets,
            ...markerStyleSnippets,
        ];

        const filtered = word.text
            ? allOptions.filter(c => c.label.toLowerCase().includes(word.text.toLowerCase()))
            : allOptions;

        return {
            from: word.from,
            options: filtered,
            validFor: /^[\w.]*$/,
        };
    };
}

/**
 * Creates a full CodeMirror extension for schema-aware autocomplete.
 * Pass the app's field schema to generate context-aware suggestions. 
 */
export function createSchemaAutocomplete(fields: SchemaField[]): Extension {
    const completionSource = buildSchemaCompletions(fields);

    return autocompletion({
        override: [completionSource],
        activateOnTyping: true,
        closeOnBlur: false,
        maxRenderedOptions: 20,
        icons: true,
    });
}
