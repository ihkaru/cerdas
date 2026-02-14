<template>
    <f7-navbar :sliding="false">
        <f7-nav-left>
            <f7-link icon-f7="arrow_left" @click="$emit('back')"></f7-link>
        </f7-nav-left>

        <f7-nav-title sliding>{{ title }}</f7-nav-title>

        <f7-nav-right>
            <f7-link v-for="action in actions" :key="action.id" :icon-f7="action.icon ?? 'square'" :color="action.color"
                @click="$emit('action', action)"></f7-link>
            <f7-link icon-f7="bars" @click="$emit('menu')"></f7-link>
        </f7-nav-right>
    </f7-navbar>
</template>

<script setup lang="ts">
interface NavAction {
    id: string;
    icon?: string;
    color?: string;
}

defineProps<{
    title: string;
    actions: NavAction[];
}>();

defineEmits<{
    (e: 'back'): void;
    (e: 'action', action: NavAction): void;
    (e: 'menu'): void;
}>();
</script>