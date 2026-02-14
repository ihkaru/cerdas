import { computed, ref, type Ref } from 'vue';

export interface ValidationItem {
    fieldName: string;
    label: string;
    message: string;
}

export interface ValidationSummary {
    errors: ValidationItem[];
    warnings: ValidationItem[];
    blanks: ValidationItem[];
}

// Interface for the FormRenderer component ref
export interface FormRendererRef {
    getValidationSummary: () => ValidationSummary;
    scrollToField: (fieldName: string) => void;
    validate: () => boolean;
}

export function useValidationSummary(formRenderer: Ref<FormRendererRef | null>) {
    const validationSheetOpen = ref(false);
    
    // Initial empty state
    const validationSummary = ref<ValidationSummary>({
        errors: [],
        warnings: [],
        blanks: []
    });

    const summaryBadgeCount = computed(() => {
        return validationSummary.value.errors.length +
            validationSummary.value.warnings.length +
            validationSummary.value.blanks.length;
    });

    const openValidationSummary = () => {
        if (formRenderer.value?.getValidationSummary) {
            validationSummary.value = formRenderer.value.getValidationSummary();
        }
        validationSheetOpen.value = true;
    };

    const scrollToField = (fieldName: string) => {
        validationSheetOpen.value = false;
        // Small delay to allow sheet to close before scrolling
        setTimeout(() => {
            if (formRenderer.value?.scrollToField) {
                formRenderer.value.scrollToField(fieldName);
            }
        }, 300);
    };

    return {
        validationSheetOpen,
        validationSummary,
        summaryBadgeCount,
        openValidationSummary,
        scrollToField
    };
}
