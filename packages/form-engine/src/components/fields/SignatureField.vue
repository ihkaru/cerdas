<template>
    <div class="field-box">
        <div class="display-flex justify-content-space-between align-items-center margin-bottom-half">
            <span class="field-label">
                {{ field.label }}
                <!-- Optional: Add required asterisk if needed, though not standard in logic yet -->
            </span>
            <f7-link small color="red" @click="clearSignature" v-if="!isEmpty && !field.readonly">Clear</f7-link>
        </div>

        <div class="signature-wrapper" :class="{ 'has-error': !!error, 'is-readonly': field.readonly }">
            <canvas ref="canvasEl" class="signature-canvas"></canvas>
        </div>

        <div v-if="error" class="field-error">
            {{ error }}
        </div>
    </div>
</template>

<style scoped>
.field-box {
    margin-bottom: 20px;
    padding: 0 16px;
}

.field-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #1a1a1a;
    line-height: 1.4;
}

.signature-wrapper {
    background: #f8f9fa;
    /* Match TextField background */
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    /* Match TextField radius */
    overflow: hidden;
    position: relative;
    height: 200px;
    width: 100%;
}

.signature-wrapper.is-readonly {
    pointer-events: none;
    background: #f0f0f0;
}

.signature-wrapper.has-error {
    border-color: #ff3b30;
}

.signature-canvas {
    width: 100%;
    height: 100%;
    display: block;
}

.field-error {
    color: #ff3b30;
    font-size: 12px;
    margin-top: 4px;
}
</style>

<script setup lang="ts">
import SignaturePad from 'signature_pad';
import { onMounted, onUnmounted, ref, watch } from 'vue';
import type { FieldDefinition } from '../../types/schema';

const props = defineProps<{
    field: FieldDefinition;
    value: any; // Data URL string
    error?: string | null;
}>();

const emit = defineEmits(['update:value']);

const canvasEl = ref<HTMLCanvasElement | null>(null);
const isEmpty = ref(true);
let signaturePad: InstanceType<typeof SignaturePad> | null = null;
let resizeObserver: ResizeObserver | null = null;

const initPad = () => {
    if (!canvasEl.value) return;

    // Initialize SignaturePad
    signaturePad = new SignaturePad(canvasEl.value, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
    });

    if (props.field.readonly) {
        signaturePad.off();
    }

    // Load initial value if exists
    if (props.value && typeof props.value === 'string') {
        signaturePad.fromDataURL(props.value);
        isEmpty.value = signaturePad.isEmpty();
    }

    // Handle changes
    signaturePad.addEventListener('endStroke', () => {
        isEmpty.value = signaturePad?.isEmpty() ?? true;
        if (!isEmpty.value) {
            const dataUrl = signaturePad?.toDataURL('image/png');
            emit('update:value', dataUrl);
        }
    });

    // Handle resize to fix canvas resolution
    resizeCanvas();
    resizeObserver = new ResizeObserver(() => resizeCanvas());
    resizeObserver.observe(canvasEl.value.parentElement!);
};

// ... existing resizeCanvas ...
// I need to keep resizeCanvas in replacement block or be precise with lines.
// The file is small, I will replace the script section carefully.

// Continuing from initPad...
const resizeCanvas = () => {
    if (!canvasEl.value || !signaturePad) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const wrapper = canvasEl.value.parentElement;
    if (!wrapper) return;
    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;
    if (canvasEl.value.width !== width * ratio) {
        canvasEl.value.width = width * ratio;
        canvasEl.value.height = height * ratio;
        canvasEl.value.getContext("2d")?.scale(ratio, ratio);
        if (props.value) { signaturePad.fromDataURL(props.value); }
        else { signaturePad.clear(); }
    }
};

const clearSignature = () => {
    signaturePad?.clear();
    isEmpty.value = true;
    emit('update:value', null);
};

onMounted(() => {
    initPad();
});

onUnmounted(() => {
    if (signaturePad) {
        signaturePad.off();
        signaturePad = null;
    }
    if (resizeObserver) {
        resizeObserver.disconnect();
    }
});

// Watch for readonly changes
watch(() => props.field.readonly, (val) => {
    if (!signaturePad) return;
    if (val) signaturePad.off();
    else signaturePad.on();
});

// Watch for external value changes (e.g. reset)
// ... keeping existing watcher ... (Wait, I need to include it in replacementBlock?)
// Yes, I am replacing from <template> almost to the end.

watch(() => props.value, (newVal) => {
    if (!signaturePad) return;
    if (newVal === null || newVal === undefined) {
        signaturePad.clear();
        isEmpty.value = true;
    } else if (signaturePad.isEmpty()) {
        signaturePad.fromDataURL(newVal);
        isEmpty.value = false;
    }
});

</script>
