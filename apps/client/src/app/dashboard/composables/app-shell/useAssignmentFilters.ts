
import type { Ref } from 'vue';
import { computed, ref } from 'vue';
import type { FilterConfig, SortConfig, Table } from '../../types';

export function useAssignmentFilters(table: Ref<Table | null>) {
    const activeSort = ref<SortConfig>({ field: 'updated_at', order: 'desc' });
    const activeFilters = ref<FilterConfig[]>([]);

    // Flatten fields for the UI selector
    const availableFields = computed(() => {
        const fields: { label: string; value: string; type: string }[] = [
            { label: 'Status', value: 'status', type: 'select' },
            { label: 'Created Date', value: 'created_at', type: 'date' },
            { label: 'Last Updated', value: 'updated_at', type: 'date' },
        ];

        if (!table.value) return fields;

        // Recursive function to extract fields from schema
        const extractFields = (schemaFields: any[], prefix = '') => {
            if (!Array.isArray(schemaFields)) return;

            schemaFields.forEach(f => {
                const currentPath = prefix ? `${prefix}.${f.name}` : f.name;
                const label = prefix ? `${prefix} > ${f.label || f.name}` : (f.label || f.name);
                
                // Add current field
                fields.push({
                    label,
                    value: currentPath,
                    type: f.type
                });

                // Recurse if nested
                if (f.type === 'nested_form' && f.fields) {
                    extractFields(f.fields, currentPath);
                }
            });
        };

        extractFields(table.value.fields);
        return fields;
    });

    const addFilter = (filter: FilterConfig) => {
        activeFilters.value.push(filter);
    };

    const removeFilter = (index: number) => {
        activeFilters.value.splice(index, 1);
    };

    const updateSort = (config: SortConfig) => {
        activeSort.value = config;
    };

    const clearFilters = () => {
        activeFilters.value = [];
    };

    return {
        activeSort,
        activeFilters,
        availableFields,
        addFilter,
        removeFilter,
        updateSort,
        clearFilters
    };
}
