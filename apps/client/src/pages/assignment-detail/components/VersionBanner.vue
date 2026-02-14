<template>
    <div>
        <!-- Version Gate Warning -->
        <div v-if="versionGate.isWarning.value" class="version-banner version-warn">
            <f7-icon f7="exclamationmark_triangle_fill" size="16" color="orange" />
            <span>Versi form baru tersedia. Silakan sync untuk update.</span>
        </div>

        <!-- Version Gate Block -->
        <div v-else-if="versionGate.isBlocked.value" class="version-banner version-block">
            <f7-icon f7="xmark_octagon_fill" size="16" color="red" />
            <span>{{ versionGate.rejectedMessage.value || 'Form ini memerlukan update. Silakan sync terlebih dahulu.'
                }}</span>
        </div>

        <!-- Version Pinning Info Banner with Upgrade Button -->
        <div v-if="shouldShowUpgradeBanner" class="version-banner version-info">
            <div class="version-banner-content">
                <f7-icon f7="info_circle_fill" size="16" color="blue" />
                <span>Draft ini menggunakan form v{{ pinnedSchemaVersion }}. Versi terbaru: v{{ currentTableVersion
                    }}.</span>
            </div>
            <f7-button fill small color="blue" @click="$emit('upgrade')" :disabled="migrating">
                <f7-preloader v-if="migrating" size="14" color="white" />
                <template v-else>🔄 Update</template>
            </f7-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Define the shape of versionGate based on usage in AssignmentDetail.vue
interface VersionGate {
    isWarning: { value: boolean };
    isBlocked: { value: boolean };
    rejectedMessage: { value: string };
}

const props = defineProps<{
    pinnedSchemaVersion: number | null;
    currentTableVersion: number | null;
    versionGate: VersionGate;
    migrating: boolean;
}>();

defineEmits<{
    (e: 'upgrade'): void;
}>();

const shouldShowUpgradeBanner = computed(() => {
    return props.pinnedSchemaVersion &&
        props.currentTableVersion &&
        props.pinnedSchemaVersion < props.currentTableVersion;
});
</script>

<style scoped>
.version-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    margin: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
}

.version-warn {
    background: #fffbeb;
    border: 1px solid #fde68a;
    color: #92400e;
}

.version-block {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
}

.version-info {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1e40af;
    justify-content: space-between;
}

.version-banner-content {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
}
</style>
