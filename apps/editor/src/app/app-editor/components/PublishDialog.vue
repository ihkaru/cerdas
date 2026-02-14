<template>
    <div v-if="visible" class="publish-overlay" @click.self="cancel">
        <div class="publish-dialog">
            <div class="dialog-header">
                <f7-icon f7="checkmark_seal_fill" size="24" color="green" />
                <h3>Publish Version</h3>
            </div>

            <div class="dialog-body">
                <!-- Changelog -->
                <div class="form-group">
                    <label>Changelog (optional)</label>
                    <textarea v-model="changelog" placeholder="Describe what changed in this version..."
                        rows="3"></textarea>
                </div>

                <!-- Version Policy -->
                <div class="form-group">
                    <label>Version Policy</label>
                    <p class="form-hint">What happens when enumerators use an older form version?</p>

                    <div class="policy-options">
                        <label class="policy-option" :class="{ selected: policy === 'accept_all' }">
                            <input type="radio" v-model="policy" value="accept_all" />
                            <div class="policy-content">
                                <div class="policy-title">
                                    <f7-icon f7="checkmark_circle" size="16" />
                                    Accept All
                                </div>
                                <div class="policy-desc">Data dari versi lama tetap diterima tanpa peringatan</div>
                            </div>
                        </label>

                        <label class="policy-option" :class="{ selected: policy === 'warn' }">
                            <input type="radio" v-model="policy" value="warn" />
                            <div class="policy-content">
                                <div class="policy-title">
                                    <f7-icon f7="exclamationmark_triangle" size="16" />
                                    Warn & Accept
                                </div>
                                <div class="policy-desc">Enumerator dapat peringatan, data tetap diterima & di-flag
                                </div>
                            </div>
                        </label>

                        <label class="policy-option" :class="{ selected: policy === 'require_update' }">
                            <input type="radio" v-model="policy" value="require_update" />
                            <div class="policy-content">
                                <div class="policy-title">
                                    <f7-icon f7="xmark_octagon" size="16" />
                                    Require Update
                                </div>
                                <div class="policy-desc">Enumerator WAJIB sync sebelum input data baru</div>
                            </div>
                        </label>
                    </div>

                    <!-- Warning for require_update -->
                    <div v-if="policy === 'require_update'" class="policy-warning">
                        <f7-icon f7="exclamationmark_triangle_fill" size="14" color="orange" />
                        <span>Enumerator yang sedang offline tidak bisa input data baru sampai mereka sync</span>
                    </div>
                </div>
            </div>

            <div class="dialog-actions">
                <f7-button @click="cancel">Cancel</f7-button>
                <f7-button fill color="green" @click="confirm">
                    <f7-icon f7="checkmark_seal" size="16" />
                    Publish
                </f7-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
    visible: boolean;
    currentPolicy?: string;
}

const props = withDefaults(defineProps<Props>(), {
    currentPolicy: 'accept_all'
});

const emit = defineEmits<{
    confirm: [{ changelog: string; versionPolicy: string }];
    cancel: [];
}>();

const changelog = ref('');
const policy = ref(props.currentPolicy);

function confirm() {
    emit('confirm', {
        changelog: changelog.value,
        versionPolicy: policy.value,
    });
    changelog.value = '';
}

function cancel() {
    emit('cancel');
    changelog.value = '';
}
</script>

<style scoped>
.publish-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 13500;
    backdrop-filter: blur(4px);
}

.publish-dialog {
    background: white;
    border-radius: 16px;
    width: 90%;
    max-width: 480px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.dialog-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 20px 24px 12px;
}

.dialog-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}

.dialog-body {
    padding: 0 24px 16px;
}

.form-group {
    margin-bottom: 16px;
}

.form-group label {
    display: block;
    font-weight: 600;
    font-size: 13px;
    color: #374151;
    margin-bottom: 6px;
}

.form-hint {
    font-size: 12px;
    color: #6b7280;
    margin: 0 0 10px;
}

textarea {
    width: 100%;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
}

textarea:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.policy-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.policy-option {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
}

.policy-option:hover {
    border-color: #93c5fd;
    background: #f0f9ff;
}

.policy-option.selected {
    border-color: #3b82f6;
    background: #eff6ff;
}

.policy-option input[type="radio"] {
    margin-top: 2px;
    accent-color: #3b82f6;
}

.policy-content {
    flex: 1;
}

.policy-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    font-size: 13px;
    color: #1f2937;
}

.policy-desc {
    font-size: 12px;
    color: #6b7280;
    margin-top: 2px;
}

.policy-warning {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    padding: 8px 12px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 8px;
    font-size: 12px;
    color: #92400e;
}

.dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 24px 20px;
    border-top: 1px solid #f3f4f6;
}
</style>
