<template>
    <f7-page>
        <f7-navbar title="App Menu"></f7-navbar>
        <f7-list style="margin-top: 0;">
            <!-- User Profile Header -->
            <f7-list-item v-if="user" :title="user.name" class="profile-header" media-item>
                <template #media>
                    <div class="menu-icon profile-icon">
                        <f7-icon f7="person_circle_fill" />
                    </div>
                </template>
                <template #subtitle>
                    <div class="role-badge">{{ displayRole }} </div>
                    <div style="font-size: 11px; opacity: 0.7; margin-top: 2px;">{{ user.email }}</div>
                </template>
            </f7-list-item>

            <!-- Fallback for Guest / Loading -->
            <f7-list-item v-else title="Guest" class="profile-header">
                <template #media>
                    <div class="menu-icon">
                        <f7-icon f7="person_circle" />
                    </div>
                </template>
                <template #subtitle>
                    <div style="font-size: 11px; opacity: 0.7;">Not logged in</div>
                </template>
            </f7-list-item>

            <!-- Navigation Items (Custom Menu) -->
            <f7-list-item v-for="(item, index) in navigation" :key="'nav-' + index" link="#" :title="item.label"
                @click="handleNavClick(item)">
                <template #media>
                    <div class="menu-icon">
                        <f7-icon :f7="item.icon || 'circle'" />
                    </div>
                </template>
            </f7-list-item>

            <!-- Separator if both exist -->
            <f7-block-title v-if="navigation.length > 0 && tables.length > 0">All Tables</f7-block-title>

            <!-- Tables List (Sibling Tables) -->
            <f7-list-item v-for="table in tables" :key="'table-' + table.id" link="#" :title="table.name"
                :after="table.id === currentTableId ? 'Current' : ''" @click="handleTableClick(table)">
                <template #media>
                    <div class="menu-icon">
                        <f7-icon :f7="table.icon || 'doc_text'" />
                    </div>
                </template>
                <template #subtitle>
                    {{ table.description }}
                </template>
            </f7-list-item>

            <f7-list-item v-if="tables.length === 0 && navigation.length === 0"
                title="No other tables found"></f7-list-item>
        </f7-list>

        <!-- Version Footer -->
        <f7-block-footer style="text-align: center; margin-top: 20px; padding-bottom: 20px;"
            @click="handleVersionClick">
            <small style="opacity: 0.6;">
                App v{{ appVersion }}<br>
                Build {{ buildTimestamp }}
            </small>
        </f7-block-footer>
    </f7-page>
</template>

<script setup lang="ts">
import { f7 } from 'framework7-vue';
import type { PropType } from 'vue';

const props = defineProps({
    tables: {
        type: Array as PropType<Record<string, unknown>[]>,
        default: () => []
    },
    navigation: {
        type: Array as PropType<Record<string, unknown>[]>,
        default: () => []
    },
    views: {
        type: Array as PropType<Record<string, unknown>[]>,
        default: () => []
    },
    currentTableId: {
        type: [String, Number],
        required: true
    },
    user: {
        type: Object as PropType<Record<string, unknown> | null>,
        default: null
    },
    role: {
        type: String,
        default: 'Guest'
    },
    appVersion: {
        type: [String, Number],
        default: 'Draft'
    },
    buildTimestamp: {
        type: String,
        default: '-'
    }
});



import { computed } from 'vue';

// Capitalize Role
const displayRole = computed(() => props.role ? props.role.charAt(0).toUpperCase() + props.role.slice(1) : 'Guest');

function handleNavClick(item: any) {
    f7.panel.close('left');

    if (item.type === 'link' && item.url) {
        window.open(item.url, '_blank');
        return;
    }

    if (item.type === 'view' && item.view_id) {
        // Find view definition 
        const viewDef = props.views.find(v => v.id === item.view_id);
        if (viewDef) {
            // Found view logic
            // Navigate to form with view param
            const url = `/app/${viewDef.form_id}?view=${item.view_id}`;
            f7.view.main.router.navigate(url, {
                reloadCurrent: true
            });
            return;
        } else {
            f7.toast.show({
                text: `View definition not found for ID: ${item.view_id}`,
                closeTimeout: 2000
            });
        }
        return;
    }

    f7.toast.show({
        text: `Unknown navigation type: ${item.type}`,
        closeTimeout: 2000
    });
}

function handleTableClick(table: any) {
    if (String(table.id) === String(props.currentTableId)) {
        f7.panel.close('left');
        return;
    }

    f7.panel.close('left');

    // Navigate using F7 router
    const url = `/app/${table.id}`;

    f7.view.main.router.navigate(url, {
        reloadCurrent: true // Replace current form
    });
}

let debugClickCount = 0;
let debugClickTimer: any = null;

function handleVersionClick() {
    debugClickCount++;

    // Reset after 2 seconds of inactivity
    if (debugClickTimer) clearTimeout(debugClickTimer);
    debugClickTimer = setTimeout(() => {
        debugClickCount = 0;
    }, 2000);

    if (debugClickCount >= 5) {
        // Trigger Debug Menu
        window.dispatchEvent(new CustomEvent('open-debug-menu'));

        // Reset
        debugClickCount = 0;
        clearTimeout(debugClickTimer);

        // Close panel so they can see the sheet
        f7.panel.close('left');
    }
}
</script>

<style scoped>
/* Profile Header Styling */
.profile-header {
    background-color: var(--f7-bg-color);
    border-bottom: 1px solid var(--f7-list-item-border-color);
}

.role-badge {
    background: var(--f7-theme-color);
    color: #fff;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 10px;
    text-transform: uppercase;
    font-weight: bold;
    margin-top: 4px;
    display: inline-block;
}

.menu-icon {
    width: 32px;
    height: 32px;
    background: #f1f5f9;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #475569;
}

.profile-icon {
    background: #e2e8f0;
    color: #1e293b;
}
</style>
