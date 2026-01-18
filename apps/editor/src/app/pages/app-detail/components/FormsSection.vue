<template>
    <section class="forms-section">
        <div class="section-header">
            <h2>Forms</h2>
            <span class="count">{{ forms.length }} forms</span>
        </div>
        <div class="forms-grid">
            <!-- Real Forms -->
            <template v-if="!loading || forms.length > 0">
                <FormCard v-for="form in forms" :key="form.id" :form="form" />
            </template>

            <!-- Skeleton Forms -->
            <div v-if="loading && forms.length === 0" v-for="i in 3" :key="'skel-form-' + i"
                class="form-card skeleton-text skeleton-effect-wave">
                <div class="form-icon skeleton-block" style="background: rgba(0,0,0,0.1)"></div>
                <div class="form-info" style="width: 100%">
                    <div class="skeleton-block"
                        style="width: 60%; height: 16px; margin-bottom: 8px; border-radius: 4px"></div>
                    <div class="skeleton-block" style="width: 90%; height: 12px; border-radius: 4px"></div>
                </div>
                <div class="form-meta">
                    <div class="skeleton-block" style="width: 60px; height: 20px; border-radius: 12px"></div>
                </div>
            </div>

            <!-- Add New Form Card -->
            <AddFormCard @click="$emit('create')" />
        </div>
    </section>
</template>
<script setup lang="ts">
import type { AppForm } from '../types/app-detail.types';
import AddFormCard from './AddFormCard.vue';
import FormCard from './FormCard.vue';

defineProps<{
    forms: AppForm[];
    loading: boolean;
}>();

defineEmits<{
    (e: 'create'): void;
}>();
</script>
<style scoped>
.forms-section {
    margin-bottom: 32px;
}

.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.section-header h2 {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.section-header .count {
    font-size: 14px;
    color: #64748b;
}

.forms-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
}

/* Skeleton Styles reused here for simplicity or could be extracted */
.form-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid transparent;
}

.form-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    margin-bottom: 12px;
}

.form-meta {
    margin-top: 12px;
}
</style>
