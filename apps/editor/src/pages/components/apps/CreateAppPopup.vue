<template>
    <f7-popup
        class="create-app-popup"
        :opened="opened"
        @popup:closed="onClosed"
    >
        <f7-page>
            <f7-navbar title="Create New App">
                <f7-nav-right>
                    <f7-link popup-close>Cancel</f7-link>
                </f7-nav-right>
            </f7-navbar>
            <f7-block style="margin-bottom: 72px;">
                <p class="create-hint">Tentukan nama dan konfigurasi dasar aplikasi pengumpulan data Anda.</p>
                <f7-list strong-ios dividers-ios inset-ios>
                    <f7-list-input
                        label="App Name"
                        type="text"
                        placeholder="Contoh: Survei Perumahan 2026"
                        :value="form.name"
                        @input="form.name = ($event.target as HTMLInputElement).value"
                        clear-button
                        required
                    />
                    <f7-list-input
                        type="textarea"
                        label="Description"
                        placeholder="Deskripsi singkat mengenai tujuan survei atau aplikasi..."
                        :value="form.description"
                        @input="form.description = ($event.target as HTMLInputElement).value"
                    />
                    <f7-list-input
                        label="Mode"
                        type="select"
                        :value="form.mode"
                        @change="form.mode = ($event.target as HTMLSelectElement).value"
                    >
                        <option value="simple">Simple (Direct Membership)</option>
                        <option value="complex">Complex (Organization Based)</option>
                    </f7-list-input>
                    
                    <f7-list-item title="Collect Data Forever (No Deadline)">
                        <template #after>
                            <f7-toggle
                                :checked="form.is_evergreen"
                                color="green"
                                @toggle:change="form.is_evergreen = $event"
                            />
                        </template>
                    </f7-list-item>

                    <template v-if="!form.is_evergreen">
                        <f7-list-input 
                            label="Start Date & Time (Open)" 
                            type="datetime-local" 
                            placeholder="Pilih tanggal mulai"
                            :value="form.start_date" 
                            @input="form.start_date = ($event.target as HTMLInputElement).value" 
                            clear-button 
                        />
                        <f7-list-input 
                            label="End Date & Time (Deadline)" 
                            type="datetime-local" 
                            placeholder="Pilih batas akhir"
                            :value="form.end_date" 
                            @input="form.end_date = ($event.target as HTMLInputElement).value" 
                            clear-button 
                        />
                        <f7-list-item title="After Deadline Behavior" smart-select :smart-select-params="{ openIn: 'popover' }">
                            <select :value="form.expired_behavior" @change="e => form.expired_behavior = (e.target as HTMLSelectElement).value">
                                <option value="read_only">Kunci Form (Read Only)</option>
                                <option value="hidden">Sembunyikan Form (Hidden)</option>
                            </select>
                        </f7-list-item>
                    </template>
                </f7-list>
            </f7-block>
            <f7-toolbar bottom class="create-app-footer">
                <f7-button
                    fill
                    large
                    @click="handleSubmit"
                    :loading="loading"
                    :disabled="!form.name.trim()"
                    class="submit-create-btn"
                >
                    Create App
                </f7-button>
            </f7-toolbar>
        </f7-page>
    </f7-popup>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import type { CreateAppPayload } from './apps.types';

const props = defineProps<{
    opened: boolean;
    loading: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:opened', value: boolean): void;
    (e: 'submit', payload: CreateAppPayload): void;
}>();

const form = reactive({
    name: '',
    description: '',
    mode: 'simple',
    is_evergreen: true,
    start_date: '',
    end_date: '',
    expired_behavior: 'read_only',
});

watch(() => props.opened, (isOpen) => {
    if (isOpen) {
        form.name = '';
        form.description = '';
        form.mode = 'simple';
        form.is_evergreen = true;
        form.start_date = '';
        form.end_date = '';
        form.expired_behavior = 'read_only';
    }
});

function onClosed() {
    emit('update:opened', false);
}

function handleSubmit() {
    if (!form.name.trim()) return;

    emit('submit', {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        mode: form.mode,
        is_evergreen: form.is_evergreen,
        start_date: !form.is_evergreen && form.start_date ? new Date(form.start_date).toISOString() : null,
        end_date: !form.is_evergreen && form.end_date ? new Date(form.end_date).toISOString() : null,
        expired_behavior: form.expired_behavior,
    });
}
</script>

<style scoped>
.create-hint {
    font-size: 13.5px;
    color: #64748b;
    margin: 0 0 16px 0;
}

.create-app-footer {
    background: #ffffff !important;
    border-top: 1px solid #e2e8f0;
    height: 64px !important;
    padding: 0 16px;
    display: flex;
    align-items: center;
    box-sizing: border-box;
}

.submit-create-btn {
    width: 100%;
    --f7-button-bg-color: #2563eb;
    --f7-button-hover-bg-color: #1d4ed8;
    border-radius: 8px;
    font-weight: 500;
}
</style>
