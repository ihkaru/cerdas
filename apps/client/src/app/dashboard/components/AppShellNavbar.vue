<template>
    <f7-navbar :sliding="false">
        <f7-nav-left>
            <f7-link icon-ios="f7:arrow_left" icon-aurora="f7:arrow_left" icon-md="material:arrow_back"
                @click="$emit('back')"></f7-link>
        </f7-nav-left>
        <f7-nav-title sliding>{{ title }}</f7-nav-title>
        <f7-nav-right>
            <f7-link v-for="action in actions" :key="action.id" :icon-f7="action.icon || 'square'"
                @click="$emit('action', action)"></f7-link>
            <f7-link icon-f7="bars" @click="console.log('Navbar Menu Clicked'); $emit('menu')"></f7-link>
        </f7-nav-right>
    </f7-navbar>
</template>

<script setup lang="ts">
defineProps<{
    title: string;
    actions: any[];
}>();

defineEmits<{
    (e: 'back'): void;
    (e: 'action', action: any): void;
    (e: 'menu'): void;
}>();
</script>
