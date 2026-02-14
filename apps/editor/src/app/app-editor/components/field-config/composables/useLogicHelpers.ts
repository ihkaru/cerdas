import { f7 } from 'framework7-vue';
import { FIELD_TYPE_META, type FieldType } from '../../../types/editor.types';

export function useLogicHelpers() {
    function getSyntaxError(code: string | undefined): string | null {
        if (!code || !code.trim()) return null;
        try {
            // eslint-disable-next-line
            new Function('ctx', 'value', 'data', code);
            return null;
        } catch (e: any) {
            return e.message;
        }
    }

    function copyToClipboard(text: string) {
        // 1. Try Modern API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                if (f7) f7.toast.show({ text: 'Copied!', position: 'center', closeTimeout: 1000 });
            }).catch(err => {
                console.error('Clipboard API failed', err);
                fallbackCopy(text);
            });
        } else {
            // 2. Fallback
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text: string) {
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // Ensure it's not visible but part of DOM
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                if (f7) f7.toast.show({ text: 'Copied!', position: 'center', closeTimeout: 1000 });
            } else {
                console.error('Fallback copy failed.');
                if (f7) f7.toast.show({ text: 'Copy failed', position: 'center', closeTimeout: 1000 });
            }
        } catch (err) {
            console.error('Fallback copy error', err);
            if (f7) f7.toast.show({ text: 'Copy error', position: 'center', closeTimeout: 1000 });
        }

        document.body.removeChild(textArea);
    }

    function getFieldIcon(type: string) {
        return FIELD_TYPE_META[type as FieldType]?.icon || 'question';
    }

    // Helper to group fields for select menu
    function getFieldsByCategory(category: string) {
        return Object.fromEntries(
            Object.entries(FIELD_TYPE_META).filter(([_, meta]) => meta.category === category)
        );
    }

    return {
        getSyntaxError,
        copyToClipboard,
        getFieldIcon,
        getFieldsByCategory
    };
}
