<template>
    <div
        class="resizable-divider"
        :class="{ dragging: isDragging }"
        @mousedown="startDrag"
        @touchstart.passive="startTouchDrag"
    >
        <div class="divider-handle">
            <span></span>
            <span></span>
            <span></span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onUnmounted, ref } from 'vue';

interface Props {
    minWidth?: number;
    maxWidth?: number;
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

function startDrag(event: MouseEvent) {
    event.preventDefault();
    isDragging.value = true;
    startPosition = props.direction === 'horizontal' ? event.clientX : event.clientY;
    emit('resize-start');
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    document.body.style.cursor = props.direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
}

function onDrag(event: MouseEvent) {
    if (!isDragging.value) return;
    const currentPosition = props.direction === 'horizontal' ? event.clientX : event.clientY;
    emit('resize', currentPosition - startPosition);
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

// Touch support for tablets / iPads
function startTouchDrag(event: TouchEvent) {
    if (event.touches.length !== 1) return;
    isDragging.value = true;
    startPosition = props.direction === 'horizontal'
        ? event.touches[0].clientX
        : event.touches[0].clientY;
    emit('resize-start');
    document.addEventListener('touchmove', onTouchDrag, { passive: false });
    document.addEventListener('touchend', stopTouchDrag);
}

function onTouchDrag(event: TouchEvent) {
    if (!isDragging.value || event.touches.length !== 1) return;
    event.preventDefault();
    const currentPosition = props.direction === 'horizontal'
        ? event.touches[0].clientX
        : event.touches[0].clientY;
    emit('resize', currentPosition - startPosition);
}

function stopTouchDrag(event: TouchEvent) {
    if (!isDragging.value) return;
    isDragging.value = false;
    const touch = event.changedTouches[0];
    const finalPosition = props.direction === 'horizontal' ? touch.clientX : touch.clientY;
    emit('resize-end', finalPosition);
    document.removeEventListener('touchmove', onTouchDrag);
    document.removeEventListener('touchend', stopTouchDrag);
}

onUnmounted(() => {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', onTouchDrag);
    document.removeEventListener('touchend', stopTouchDrag);
});
</script>

<style scoped>
/*
 * Professional zero-gap panel divider.
 *
 * Visually: just a 1px border line between panels (no extra width).
 * Functionally: wide transparent hover zone via ::before pseudo-element
 * so users can grab it without pixel-perfect precision.
 *
 * Pattern used by: VS Code, Figma, Linear, AppSheet.
 */
.resizable-divider {
    flex-shrink: 0;
    /* The divider itself is visually 1px — the border between panels */
    width: 1px;
    background: #e2e8f0;
    cursor: col-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 10;
    transition: background 0.15s;
}

/* Wide transparent hit zone: extends 4px each side without affecting layout */
.resizable-divider::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: -4px;
    right: -4px;
    cursor: col-resize;
}

.resizable-divider:hover,
.resizable-divider.dragging {
    background: #93c5fd;
}

/* Floating handle: centered, appears on hover */
.divider-handle {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 16px;
    height: 44px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    opacity: 0;
    transition: opacity 0.15s, border-color 0.15s, box-shadow 0.15s;
    pointer-events: none;
    z-index: 20;
}

.resizable-divider:hover .divider-handle,
.resizable-divider.dragging .divider-handle {
    opacity: 1;
    border-color: #93c5fd;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.divider-handle span {
    width: 3px;
    height: 3px;
    background: #94a3b8;
    border-radius: 50%;
    transition: background 0.15s;
}

.resizable-divider:hover .divider-handle span,
.resizable-divider.dragging .divider-handle span {
    background: #3b82f6;
}
</style>
