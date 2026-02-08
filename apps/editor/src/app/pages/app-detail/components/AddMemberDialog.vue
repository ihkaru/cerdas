<template>
    <f7-popup :opened="opened" @popup:closed="$emit('update:opened', false)" class="add-member-popup" push>
        <f7-page>
            <f7-navbar title="Add Team Member">
                <f7-nav-right>
                    <f7-link popup-close>Close</f7-link>
                </f7-nav-right>
            </f7-navbar>
            <f7-block-title>Member Details</f7-block-title>
            <f7-list>
                <f7-list-input label="Email" type="email" placeholder="user@example.com" :value="email"
                    @input="email = $event.target.value" clear-button required validate
                    error-message="Please enter a valid email">
                </f7-list-input>

                <f7-list-input label="Role" type="select" :value="role" @change="role = $event.target.value"
                    placeholder="Select Role">
                    <option value="app_admin">App Admin</option>
                    <option value="editor">Editor</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="enumerator">Enumerator</option>
                    <option value="viewer">Viewer</option>
                </f7-list-input>

                <f7-block-footer>
                    <p>
                        <strong>App Admin:</strong> Full access to edit app and manage members.<br>
                        <strong>Editor:</strong> Can edit app structure but not manage members.<br>
                        <strong>Supervisor:</strong> Can view all data and manage assignments.<br>
                        <strong>Enumerator:</strong> data collection only.<br>
                        <strong>Viewer:</strong> Read-only access to data.
                    </p>
                </f7-block-footer>
            </f7-list>
            <f7-block>
                <f7-button fill large @click="handleSubmit" :loading="loading" preloader>Add Member</f7-button>
            </f7-block>
        </f7-page>
    </f7-popup>
</template>

<script setup lang="ts">
import { f7Block, f7BlockFooter, f7BlockTitle, f7Button, f7Link, f7List, f7ListInput, f7Navbar, f7NavRight, f7Page, f7Popup } from 'framework7-vue';
import { ref, watch } from 'vue';

const props = defineProps<{
    opened: boolean;
    loading?: boolean;
}>();

const emit = defineEmits(['update:opened', 'submit']);

const email = ref('');
const role = ref('enumerator');

watch(() => props.opened, (newVal) => {
    if (newVal) {
        // Reset form on open
        email.value = '';
        role.value = 'enumerator';
    }
});

function handleSubmit() {
    if (!email.value) return;
    emit('submit', { email: email.value, role: role.value });
}
</script>

<style scoped>
.add-member-popup {
    /* Optional custom styling */
}
</style>
