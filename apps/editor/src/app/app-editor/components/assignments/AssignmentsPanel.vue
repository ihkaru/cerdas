<template>
    <div class="assignments-panel">
        <!-- Toolbar -->
        <div class="assignments-toolbar">
            <f7-searchbar :value="searchQuery" placeholder="Search assignments..."
                @input="searchQuery = ($event.target as HTMLInputElement).value" :disable-button="false"
                class="assignments-search" />
            <f7-segmented strong class="status-filter">
                <f7-button :active="statusFilter === 'all'" @click="statusFilter = 'all'" small>
                    All
                </f7-button>
                <f7-button :active="statusFilter === 'assigned'" @click="statusFilter = 'assigned'" small>
                    Assigned
                </f7-button>
                <f7-button :active="statusFilter === 'in_progress'" @click="statusFilter = 'in_progress'" small>
                    In Progress
                </f7-button>
                <f7-button :active="statusFilter === 'completed'" @click="statusFilter = 'completed'" small>
                    Completed
                </f7-button>
            </f7-segmented>
        </div>

        <!-- Stats -->
        <div class="assignments-stats">
            <div class="stat">
                <span class="stat-value">{{ assignments.length }}</span>
                <span class="stat-label">Total</span>
            </div>
            <div class="stat">
                <span class="stat-value">{{ assignedCount }}</span>
                <span class="stat-label">Assigned</span>
            </div>
            <div class="stat">
                <span class="stat-value">{{ inProgressCount }}</span>
                <span class="stat-label">In Progress</span>
            </div>
            <div class="stat">
                <span class="stat-value">{{ completedCount }}</span>
                <span class="stat-label">Completed</span>
            </div>
        </div>

        <!-- Actions Bar -->
        <div class="assignments-actions">
            <f7-button fill small @click="importCSV">
                <f7-icon f7="arrow_down_doc" />
                Import CSV
            </f7-button>
            <f7-button outline small @click="exportCSV">
                <f7-icon f7="arrow_up_doc" />
                Export
            </f7-button>
            <f7-button outline small @click="bulkAssign">
                <f7-icon f7="person_2" />
                Bulk Assign
            </f7-button>
            <f7-button outline small @click="addAssignment">
                <f7-icon f7="plus" />
                Add Single
            </f7-button>
        </div>

        <!-- Assignment List -->
        <f7-list class="assignments-list" media-list>
            <f7-list-item v-for="assignment in filteredAssignments" :key="assignment.id" :title="assignment.name"
                :subtitle="assignment.description"
                :footer="`${assignment.groupPath} · Assigned: ${assignment.assignedTo || 'Unassigned'}`" checkbox
                :checked="selectedIds.includes(assignment.id)" @change="toggleSelection(assignment.id)">
                <f7-icon slot="media" f7="doc_text" :color="getStatusColor(assignment.status)" />
                <f7-badge slot="after" :color="getStatusColor(assignment.status)">
                    {{ assignment.status }}
                </f7-badge>
            </f7-list-item>
        </f7-list>

        <!-- Empty State -->
        <f7-block v-if="filteredAssignments.length === 0" class="empty-state">
            <f7-icon f7="tray" class="empty-icon" />
            <p class="empty-title">No assignments found</p>
            <p class="empty-subtitle">Import from CSV or add assignments manually</p>
        </f7-block>

        <!-- Selection Actions (shown when items selected) -->
        <div v-if="selectedIds.length > 0" class="selection-bar">
            <span>{{ selectedIds.length }} selected</span>
            <f7-button small @click="assignSelected">Assign To...</f7-button>
            <f7-button small color="red" @click="deleteSelected">Delete</f7-button>
            <f7-button small @click="selectedIds = []">Clear</f7-button>
        </div>

        <!-- CSV Import Popup -->
        <CsvImportPopup :opened="showImportPopup" @close="showImportPopup = false" @import="handleImportData" />

        <!-- Add Assignment Popup -->
        <AddAssignmentPopup :opened="showAddPopup" @close="showAddPopup = false" @save="handleAddAssignment" />
    </div>
</template>

<script setup lang="ts">
import { f7 } from 'framework7-vue';
import { computed, ref } from 'vue';
import AddAssignmentPopup from './AddAssignmentPopup.vue';
import CsvImportPopup from './CsvImportPopup.vue';

// ============================================================================
// Types
// ============================================================================

interface Assignment {
    id: string;
    name: string;
    description: string;
    groupPath: string;
    status: 'assigned' | 'in_progress' | 'completed';
    assignedTo: string | null;
    prelistData: Record<string, unknown>;
}

// ============================================================================
// State
// ============================================================================

const searchQuery = ref('');
const statusFilter = ref<'all' | 'assigned' | 'in_progress' | 'completed'>('all');
const selectedIds = ref<string[]>([]);

// Popup state
const showImportPopup = ref(false);
const showAddPopup = ref(false);

// Mock data for initial prototype
const assignments = ref<Assignment[]>([
    {
        id: '1',
        name: 'Task 1 - John Doe',
        description: 'Survey respondent in urban area',
        groupPath: 'Jabar / Bandung',
        status: 'assigned',
        assignedTo: 'Enumerator A',
        prelistData: { fullname: 'John Doe', province: 'jabar', city: 'bdg' },
    },
    {
        id: '2',
        name: 'Task 2 - Jane Smith',
        description: 'Survey respondent in rural area',
        groupPath: 'Jatim / Surabaya',
        status: 'in_progress',
        assignedTo: 'Enumerator B',
        prelistData: { fullname: 'Jane Smith', province: 'jatim', city: 'sby' },
    },
    {
        id: '3',
        name: 'Task 3 - Budi Santoso',
        description: 'Survey respondent - completed',
        groupPath: 'Bali / Denpasar',
        status: 'completed',
        assignedTo: 'Enumerator C',
        prelistData: { fullname: 'Budi Santoso', province: 'bali', city: 'dps' },
    },
    {
        id: '4',
        name: 'Task 4 - Siti Rahayu',
        description: 'Pending assignment',
        groupPath: 'Jabar / Cirebon',
        status: 'assigned',
        assignedTo: null,
        prelistData: { fullname: 'Siti Rahayu', province: 'jabar', city: 'crb' },
    },
]);

// ============================================================================
// Computed
// ============================================================================

const filteredAssignments = computed(() => {
    let result = assignments.value;

    if (statusFilter.value !== 'all') {
        result = result.filter(a => a.status === statusFilter.value);
    }

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(a =>
            a.name.toLowerCase().includes(query) ||
            a.description.toLowerCase().includes(query) ||
            a.groupPath.toLowerCase().includes(query)
        );
    }

    return result;
});

const assignedCount = computed(() => assignments.value.filter(a => a.status === 'assigned').length);
const inProgressCount = computed(() => assignments.value.filter(a => a.status === 'in_progress').length);
const completedCount = computed(() => assignments.value.filter(a => a.status === 'completed').length);

// ============================================================================
// Methods
// ============================================================================

function getStatusColor(status: string): string {
    switch (status) {
        case 'assigned': return 'orange';
        case 'in_progress': return 'blue';
        case 'completed': return 'green';
        default: return 'gray';
    }
}

function toggleSelection(id: string) {
    const index = selectedIds.value.indexOf(id);
    if (index === -1) {
        selectedIds.value.push(id);
    } else {
        selectedIds.value.splice(index, 1);
    }
}

function importCSV() {
    showImportPopup.value = true;
}

function exportCSV() {
    f7.toast.show({ text: 'Exporting assignments...', position: 'center', closeTimeout: 2000 });
    // Implementation pending backend support
}

function bulkAssign() {
    f7.toast.show({ text: 'Bulk assign dialog coming soon...', position: 'center', closeTimeout: 2000 });
    // Implementation pending design
}

function addAssignment() {
    showAddPopup.value = true;
}

function assignSelected() {
    f7.toast.show({
        text: `Assigning ${selectedIds.value.length} items...`,
        position: 'center',
        closeTimeout: 2000
    });
}

function deleteSelected() {
    f7.dialog.confirm(
        `Delete ${selectedIds.value.length} assignments?`,
        'Delete Assignments',
        () => {
            assignments.value = assignments.value.filter(a => !selectedIds.value.includes(a.id));
            selectedIds.value = [];
            f7.toast.show({ text: 'Assignments deleted', position: 'center', closeTimeout: 2000 });
        }
    );
}

// Handler for CSV import
function handleImportData(data: Record<string, unknown>[]) {
    // Convert imported data to assignments
    const newAssignments: Assignment[] = data.map((row, index) => ({
        id: `import-${Date.now()}-${index}`,
        name: String(row.name || row.fullname || `Task ${assignments.value.length + index + 1}`),
        description: String(row.description || 'Imported from CSV'),
        groupPath: String(row.groupPath || 'Unassigned'),
        status: 'assigned' as const,
        assignedTo: null,
        prelistData: row,
    }));

    assignments.value.push(...newAssignments);
    f7.toast.show({ text: `${newAssignments.length} assignments imported`, position: 'center', closeTimeout: 2000 });
}

// Handler for manual add
function handleAddAssignment(data: { prelistData: Record<string, unknown>; assignedTo: string | null }) {
    const newAssignment: Assignment = {
        id: `manual-${Date.now()}`,
        name: String(data.prelistData.name || data.prelistData.fullname || `Task ${assignments.value.length + 1}`),
        description: String(data.prelistData.description || 'Manually added'),
        groupPath: 'Unassigned',
        status: 'assigned',
        assignedTo: data.assignedTo,
        prelistData: data.prelistData,
    };

    assignments.value.push(newAssignment);
}
</script>

<style scoped>
.assignments-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.assignments-toolbar {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: var(--f7-bars-bg-color);
    border-bottom: 1px solid var(--f7-list-border-color);
}

.assignments-search {
    margin: 0;
}

.status-filter {
    align-self: flex-start;
}

.assignments-stats {
    display: flex;
    justify-content: space-around;
    padding: 12px;
    background: var(--f7-block-strong-bg-color);
    border-bottom: 1px solid var(--f7-list-border-color);
}

.stat {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-value {
    font-size: 20px;
    font-weight: 600;
    color: var(--f7-theme-color);
}

.stat-label {
    font-size: 11px;
    color: var(--f7-list-item-subtitle-text-color);
    text-transform: uppercase;
}

.assignments-actions {
    display: flex;
    gap: 8px;
    padding: 12px;
    flex-wrap: wrap;
}

.assignments-list {
    flex: 1;
    overflow-y: auto;
    margin: 0;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    text-align: center;
}

.empty-icon {
    font-size: 48px;
    color: var(--f7-theme-color);
    opacity: 0.3;
    margin-bottom: 12px;
}

.empty-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 4px 0;
}

.empty-subtitle {
    font-size: 13px;
    color: var(--f7-list-item-subtitle-text-color);
    margin: 0;
}

.selection-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--f7-theme-color);
    color: white;
}

.selection-bar span {
    flex: 1;
    font-weight: 500;
}
</style>
