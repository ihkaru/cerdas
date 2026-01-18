<template>
    <f7-popup :opened="visible" :close-on-backdrop-click="false" class="sync-popup">
        <f7-page-content
            class="display-flex flex-direction-column justify-content-center align-items-center height-100 bg-color-white">
            <div class="text-align-center" style="width: 80%; max-width: 400px;">
                <!-- Cloud Icon Animation -->
                <div class="margin-bottom-xl">
                    <f7-icon f7="cloud_upload_fill" size="80" class="text-color-blue sync-pulse"></f7-icon>
                </div>

                <h2 class="no-margin-top">Syncing Data...</h2>
                <p class="text-color-gray margin-bottom-lg">{{ message }}</p>

                <!-- Progress Bar -->
                <div class="progressbar-wrapper bg-color-gray-light"
                    style="height: 6px; border-radius: 3px; overflow: hidden;">
                    <div class="bg-color-blue height-100"
                        :style="{ width: progress + '%', transition: 'width 0.3s ease' }">
                    </div>
                </div>

                <div class="margin-top display-flex justify-content-between text-color-gray size-12">
                    <span>Progress</span>
                    <span>{{ progress }}%</span>
                </div>

                <p class="margin-top-xl text-color-gray size-12 text-align-center">
                    Please do not close the app.
                </p>
            </div>
        </f7-page-content>
    </f7-popup>
</template>

<script setup lang="ts">
defineProps<{
    visible: boolean;
    progress: number;
    message: string;
}>();
</script>

<style scoped>
@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 1;
    }

    50% {
        transform: scale(1.05);
        opacity: 0.8;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

.sync-pulse {
    animation: pulse 2s infinite ease-in-out;
}
</style>
