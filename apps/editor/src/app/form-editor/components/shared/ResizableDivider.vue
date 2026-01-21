<template>
    <div class="resizable-divider" :class="{ dragging: isDragging }" @mousedown="startDrag">
        <div class="divider-handle">
            <div class="handle-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onUnmounted, ref } from 'vue';

interface Props {
    /** Minimum width in pixels */
    minWidth?: number;
    /** Maximum width in pixels */
    maxWidth?: number;
    /** Direction: 'horizontal' resizes width, 'vertical' resizes height */
    direction?: 'horizontal' | 'vertical';
}

const props = withDefaults(defineProps<Props>(), {
    minWidth: 200,
    maxWidth: 800,
    direction: 'horizontal'
});

const emit = defineEmits<{
    (e: 'resize', delta: number): void;
    (e: 'resize-start'): void;
    (e: 'resize-end', finalPosition: number): void;
}>();

const isDragging = ref(false);
let startPosition = 0;
let currentDelta = 0;

function startDrag(event: MouseEvent) {
    event.preventDefault();
    isDragging.value = true;
    startPosition = props.direction === 'horizontal' ? event.clientX : event.clientY;
    currentDelta = 0;

    emit('resize-start');

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    document.body.style.cursor = props.direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
}

function onDrag(event: MouseEvent) {
    if (!isDragging.value) return;

    const currentPosition = props.direction === 'horizontal' ? event.clientX : event.clientY;
    currentDelta = currentPosition - startPosition;

    emit('resize', currentDelta);
}

function stopDrag(event: MouseEvent) {
    if (!isDragging.value) return;

    isDragging.value = false;
    const finalPosition = props.direction === 'horizontal' ? event.clientX : event.clientY;

    emit('resize-end', finalPosition);

    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
}

onUnmounted(() => {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
});
</script>

<style scoped>
.resizable-divider {
    flex-shrink: 0;
    width: 6px;
    background: transparent;
    cursor: col-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
    position: relative;
    z-index: 10;
}

.resizable-divider:hover,
.resizable-divider.dragging {
    background: rgba(59, 130, 246, 0.1);
}

.divider-handle {
    width: 4px;
    height: 32px;
    background: #e2e8f0;
    border-radius: 2px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    transition: background 0.15s;
}

.resizable-divider:hover .divider-handle,
.resizable-divider.dragging .divider-handle {
    background: #3b82f6;
}

.handle-dots span {
    width: 2px;
    height: 2px;
    background: #94a3b8;
    border-radius: 50%;
    transition: background 0.15s;
}

.resizable-divider:hover .handle-dots span,
.resizable-divider.dragging .handle-dots span {
    background: white;
}
</style>
