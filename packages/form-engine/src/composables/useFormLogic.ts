import { evaluate } from '@cerdas/expression-engine';
import { computed, onUnmounted, ref, shallowReactive, type Ref } from 'vue';
import type { AppSchema, FieldDefinition } from '../types/schema';
import { defaultUtils, executeClosure, type ClosureContext } from '../utils/ClosureCompiler';

export function useFormLogic(
    schema: Ref<AppSchema>,
    initialData: Record<string, any> | undefined,
    externalContext: Ref<Record<string, any>>,
    emit: (event: 'update:data', ...args: any[]) => void
) {
    // --- State ---
    const formData = shallowReactive({ ...initialData });
    const errors = ref<Record<string, string>>({});
    
    // Timeouts
    let visibilityCacheTimeout: any = null;
    let emitTimeout: any = null;

    onUnmounted(() => {
        if (visibilityCacheTimeout) clearTimeout(visibilityCacheTimeout);
        if (emitTimeout) clearTimeout(emitTimeout);
    });

    const allFields = computed(() => schema.value.fields || []);

    // --- Helpers ---

    const createContext = (): ClosureContext => ({
        row: formData,
        utils: defaultUtils,
        ...externalContext.value
    });

    const evaluateEffectiveValue = (
        field: FieldDefinition,
        propKey: 'show_if' | 'editable_if' | 'required_if',
        defaultVal: boolean
    ): boolean => {
        const fnKey = `${propKey}_fn` as keyof FieldDefinition;
        const legacyKey = propKey;
        const ctx = createContext();

        if (field[fnKey]) {
            return !!executeClosure(field[fnKey] as string, ctx, defaultVal);
        }

        const val = field[legacyKey] ?? (propKey === 'show_if' ? field.show_if_js : undefined);
        if (val === undefined || val === null) return defaultVal;
        if (typeof val === 'boolean') return val;
        if (typeof val === 'string' && val.trim() === '') return defaultVal;

        const cleanExpr = val.startsWith('=') ? val.substring(1) : val;
        try {
            return !!evaluate(cleanExpr, { row: formData, ...externalContext.value });
        } catch (e) {
            return defaultVal;
        }
    };

    // --- Visibility Logic ---

    const visibilityCache = ref<Map<string, boolean>>(new Map());

    const visibleFields = computed(() => {
        return allFields.value.filter(field => {
            const hasLogic = field.show_if_fn || field.show_if !== undefined || field.show_if_js;
            if (!hasLogic) return true;

            const cached = visibilityCache.value.get(field.name);
            if (cached !== undefined) return cached;

            const isVisible = evaluateEffectiveValue(field, 'show_if', true);
            visibilityCache.value.set(field.name, isVisible);
            return isVisible;
        });
    });

    const updateVisibilityCache = () => {
        if (visibilityCacheTimeout) clearTimeout(visibilityCacheTimeout);
        visibilityCacheTimeout = setTimeout(() => {
            const newCache = new Map<string, boolean>();
            allFields.value.forEach(field => {
                const hasLogic = field.show_if_fn || field.show_if !== undefined || field.show_if_js;
                if (hasLogic) {
                    newCache.set(field.name, evaluateEffectiveValue(field, 'show_if', true));
                }
            });
            visibilityCache.value = newCache;
        }, 300);
    };

    // --- Formula & Defaults ---

    const calculateFormulas = () => {
        allFields.value.forEach(f => {
            let newVal: any = undefined;
            let calculated = false;

            if (f.formula_fn) {
                const ctx = createContext();
                newVal = executeClosure(f.formula_fn, ctx, undefined);
                calculated = true;
            } else if (f.formula) {
                const evalContext = { row: formData, ...externalContext.value };
                const cleanExpr = f.formula.startsWith('=') ? f.formula.substring(1) : f.formula;
                try {
                    newVal = evaluate(cleanExpr, evalContext);
                    calculated = true;
                } catch (e) { /* ignore */ }
            }

            if (calculated && newVal !== undefined && formData[f.name] !== newVal) {
                formData[f.name] = newVal;
            }
        });
    };

    const initDefaults = () => {
        allFields.value.forEach(f => {
            if (formData[f.name] === undefined) {
                let defaultVal = f.initialValue;
                if (f.initial_value_fn) {
                    const ctx = createContext();
                    defaultVal = executeClosure(f.initial_value_fn, ctx, defaultVal);
                } else if (typeof f.initialValue === 'string' && f.initialValue.startsWith('=')) {
                    const evalContext = { row: formData, ...externalContext.value };
                    defaultVal = evaluate(f.initialValue.substring(1), evalContext);
                }
                if (defaultVal !== undefined) {
                    formData[f.name] = defaultVal;
                }
            }
        });
        calculateFormulas();
    };

    // --- Updates ---

    const debouncedEmit = () => {
        if (emitTimeout) clearTimeout(emitTimeout);
        emitTimeout = setTimeout(() => {
            emit('update:data', { ...formData });
        }, 150);
    };

    const updateField = (name: string, value: any) => {
        formData[name] = value;
        calculateFormulas();
        if (errors.value[name]) delete errors.value[name];
        debouncedEmit();
        updateVisibilityCache();
    };

    return {
        formData,
        errors,
        visibleFields,
        createContext,
        evaluateEffectiveValue,
        initDefaults,
        updateField
    };
}
