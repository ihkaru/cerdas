import { nextTick, type Ref } from 'vue';
import type { AppSchema } from '../types/schema';

export function useFormNavigation(
  renderLimit: Ref<number>, 
  schema: Ref<AppSchema>
) {

  /**
   * Scroll to a field by name (handles nested paths like "family[0].member_name")
   */
  const scrollToField = async (fieldName: string) => {
    console.log('[DEBUG] scrollToField:', fieldName);
  
    // Always close open nested popups first ensures we can navigate cleanly
    window.dispatchEvent(new CustomEvent('close-nested-popups'));

    let targetField = fieldName;
    let nestedDetails = null;

    // Check if it's a nested path
    if (fieldName.includes('[')) {
      const match = fieldName.match(/^([^\[]+)\[(\d+)\]\.(.+)$/);
      if (match) {
        const parentField = match[1]!;
        const indexStr = match[2]!;
        const childPath = match[3]!;
        
        if (childPath) {
            targetField = parentField; 
            nestedDetails = {
                parentField,
                index: parseInt(indexStr, 10),
                childFieldName: childPath.split('[')[0]!.split('.')[0],
                fullPath: fieldName
            };
        }
      }
    }

    // Ensure the target field (or parent) is rendered
    // Use .value for refs
    const currentSchema = schema.value;
    if (currentSchema && currentSchema.fields) {
        const fieldIndex = currentSchema.fields.findIndex(f => f.name === targetField);
        if (fieldIndex !== -1 && fieldIndex >= renderLimit.value) {
            console.log(`[DEBUG] Field ${targetField} is at index ${fieldIndex}, expanding renderLimit from ${renderLimit.value}`);
            renderLimit.value = fieldIndex + 5; // Expand limit
            await nextTick();
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async component hydration
        }
    }
    
    // Handle Nested Dispatch
    if (nestedDetails) {
        console.log('[DEBUG] Dispatching open-nested-field:', nestedDetails);
        window.dispatchEvent(new CustomEvent('open-nested-field', { detail: nestedDetails }));
        
        // Also scroll parent into view so user sees context
        const parentEl = document.querySelector(`[data-field-name="${targetField}"]`);
        if (parentEl) {
            parentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    // Simple parent field - scroll directly
    const element = document.querySelector(`[data-field-name="${fieldName}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight-field');
      setTimeout(() => element.classList.remove('highlight-field'), 2000);
    } else {
        console.warn('[DEBUG] Field element not found:', fieldName);
    }
  };

  return {
    scrollToField
  };
}
