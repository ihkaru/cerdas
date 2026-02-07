<template>
    <div class="empty-state-container">
        <div class="empty-state">
            <f7-icon :f7="icon" class="empty-state-icon" />
            <h3>{{ title }}</h3>
            <p>
                <slot>{{ message }}</slot>
            </p>
            <f7-button fill round @click="$emit('action')">{{ actionLabel }}</f7-button>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    icon: string;
    title: string;
    message?: string;
    actionLabel: string;
}>();

defineEmits<{
    action: [];
}>();
</script>
