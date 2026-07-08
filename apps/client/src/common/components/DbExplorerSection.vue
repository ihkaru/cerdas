<template>
  <div>
    <!-- DB Statistics & Tables -->
    <div class="dbg-section">
      <div class="dbg-label" style="display: flex; justify-content: space-between; align-items: center;">
        <span>Database Status & Tables</span>
        <a href="#" @click.prevent="refreshDbStats" style="font-size: 12px;">↻ Refresh Stats</a>
      </div>

      <div v-if="dbError" class="dbg-row" style="color: #ff5555; font-size: 12px; margin-bottom: 8px;">
        Error: {{ dbError }}
      </div>

      <!-- Table counts grid -->
      <div style="background: #1a1a2e; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
        <table style="width: 100%; border-collapse: collapse; color: #f8f8f2; font-family: monospace; font-size: 13px;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); text-align: left; color: #2196f3;">
              <th style="padding-bottom: 6px;">Table Name</th>
              <th style="padding-bottom: 6px; text-align: right;">Row Count</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in dbTables" :key="t.name" style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 6px 0;">{{ t.name }}</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #50fa7b;">{{ t.count }}</td>
            </tr>
            <tr v-if="dbTables.length === 0">
              <td colspan="2" style="text-align: center; color: #888; padding: 12px;">No tables found. Click Refresh.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- SQL Console -->
    <div class="dbg-section">
      <div class="dbg-label">SQL Console</div>

      <!-- Templates -->
      <div style="margin-bottom: 8px;">
        <label style="font-size: 11px; color: #888; display: block; margin-bottom: 4px;">Quick Templates:</label>
        <select v-model="selectedTemplate" @change="applyTemplate" style="width: 100%; padding: 8px; border-radius: 6px; background: #2a2a40; color: #fff; border: 1px solid #444; font-size: 13px;">
          <option value="">-- Choose a template query --</option>
          <option v-for="tpl in sqlTemplates" :key="tpl.label" :value="tpl.query">{{ tpl.label }}</option>
        </select>
      </div>

      <!-- Query Area -->
      <div style="margin-bottom: 8px;">
        <textarea v-model="sqlQuery" placeholder="Type SQL query here (e.g. SELECT * FROM assignments LIMIT 5)..." rows="4" style="width: 100%; font-family: monospace; font-size: 13px; padding: 8px; border-radius: 6px; background: #111; color: #50fa7b; border: 1px solid #333; resize: vertical; box-sizing: border-box;"></textarea>
      </div>

      <!-- Run Button -->
      <div style="display: flex; gap: 8px; margin-bottom: 12px;">
        <f7-button fill color="blue" @click="runSqlQuery" style="flex: 1;">⚡ Run Query</f7-button>
        <f7-button outline color="red" @click="clearSqlOutput" style="width: 70px;">Clear</f7-button>
      </div>

      <!-- Output -->
      <div class="dbg-label" style="margin-top: 12px;">Query Result</div>
      <div style="background: #1a1a2e; border-radius: 8px; padding: 8px; font-family: monospace; font-size: 11px; overflow: auto; max-height: 250px; -webkit-overflow-scrolling: touch; border: 1px solid rgba(255,255,255,0.05);">
        <div v-if="sqlError" style="color: #ff5555; white-space: pre-wrap;">❌ Error: {{ sqlError }}</div>
        <div v-else-if="sqlResultMsg" style="color: #50fa7b; font-weight: bold;">{{ sqlResultMsg }}</div>

        <!-- Dynamic Data Table -->
        <div v-else-if="sqlResultData && sqlResultData.length > 0" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; color: #f8f8f2; font-family: monospace; font-size: 11px;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.2); text-align: left; color: #ff79c6;">
                <th v-for="col in sqlResultCols" :key="col" style="padding: 4px 8px; border-right: 1px solid rgba(255,255,255,0.1); white-space: nowrap;">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in sqlResultData" :key="idx" style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td v-for="col in sqlResultCols" :key="col" style="padding: 4px 8px; border-right: 1px solid rgba(255,255,255,0.05); white-space: nowrap; max-width: 180px; overflow: hidden; text-overflow: ellipsis; cursor: pointer; color: #8be9fd;" @click="showFullCellValue(row[col])">
                  {{ formatCell(row[col]) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else style="color: #888; text-align: center; padding: 12px;">No results to show.</div>
      </div>
    </div>

    <!-- DB Maintenance -->
    <div class="dbg-section" style="padding-bottom: 24px;">
      <div class="dbg-label">DB Maintenance</div>
      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
        <f7-button fill color="orange" @click="persistWebStore">💾 Save/Persist SQLite to Store</f7-button>
        <f7-button fill color="red" @click="promptResetDb">⚠️ Reset & Purge Local Database</f7-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { f7 } from 'framework7-vue';
import { onMounted, ref } from 'vue';
import { databaseService } from '../database/DatabaseService';

const dbTables = ref<{ name: string; count: number }[]>([]);
const dbError = ref('');

const sqlQuery = ref('');
const selectedTemplate = ref('');
const sqlError = ref('');
const sqlResultMsg = ref('');
const sqlResultData = ref<any[]>([]);
const sqlResultCols = ref<string[]>([]);

const sqlTemplates = [
  { label: '1. Count assignments grouped by table_id & status', query: 'SELECT table_id, status, COUNT(*) as total FROM assignments GROUP BY table_id, status;' },
  { label: '2. Show all rows in tables metadata', query: 'SELECT id, name, version, version_policy, synced_at FROM tables;' },
  { label: '3. List assignments (first 10)', query: 'SELECT id, table_id, status, external_id FROM assignments LIMIT 10;' },
  { label: '4. Check responses (first 5)', query: 'SELECT local_id, assignment_id, is_synced, created_at FROM responses LIMIT 5;' },
  { label: '5. Column schema of assignments table', query: 'PRAGMA table_info(assignments);' },
  { label: '6. Check apps list & views metadata', query: 'SELECT id, name, slug, version FROM apps;' },
];

async function refreshDbStats() {
  dbError.value = '';
  try {
    const db = await databaseService.getDB();
    const tableRes = await db.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'jeep_sqlite_%';"
    );
    const tables = tableRes.values || [];
    const stats: { name: string; count: number }[] = [];
    for (const t of tables) {
      const countRes = await db.query(`SELECT COUNT(*) as count FROM "${t.name}";`);
      stats.push({
        name: t.name,
        count: countRes.values?.[0]?.count ?? 0,
      });
    }
    dbTables.value = stats;
  } catch (err: any) {
    dbError.value = err.message || String(err);
  }
}

function applyTemplate() {
  if (selectedTemplate.value) {
    sqlQuery.value = selectedTemplate.value;
  }
}

function clearSqlOutput() {
  sqlError.value = '';
  sqlResultMsg.value = '';
  sqlResultData.value = [];
  sqlResultCols.value = [];
}

function formatCell(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'object') {
    try {
      const str = JSON.stringify(val);
      return str.length > 25 ? str.slice(0, 25) + '…' : str;
    } catch {
      return '[object]';
    }
  }
  const strVal = String(val);
  return strVal.length > 30 ? strVal.slice(0, 30) + '…' : strVal;
}

function showFullCellValue(val: any) {
  if (val === null || val === undefined) return;
  let formatted = '';
  if (typeof val === 'object') {
    formatted = JSON.stringify(val, null, 2);
  } else {
    try {
      const parsed = JSON.parse(val);
      formatted = JSON.stringify(parsed, null, 2);
    } catch {
      formatted = String(val);
    }
  }
  f7.dialog.alert(
    `<pre style="text-align: left; font-family: monospace; font-size: 11px; max-height: 250px; overflow: auto; white-space: pre-wrap; word-break: break-all;">${formatted}</pre>`, 
    'Cell Value'
  );
}

async function runSqlQuery() {
  clearSqlOutput();
  if (!sqlQuery.value.trim()) {
    sqlError.value = 'Query is empty';
    return;
  }
  try {
    const db = await databaseService.getDB();
    const queryUpper = sqlQuery.value.trim().toUpperCase();
    if (queryUpper.startsWith('SELECT') || queryUpper.startsWith('PRAGMA') || queryUpper.startsWith('EXPLAIN')) {
      const res = await db.query(sqlQuery.value);
      const rows = res.values || [];
      sqlResultData.value = rows;
      if (rows.length > 0) {
        sqlResultCols.value = Object.keys(rows[0]);
      } else {
        sqlResultMsg.value = 'Executed successfully. 0 rows returned.';
      }
    } else {
      const res = await db.execute(sqlQuery.value);
      const changes = res.changes?.changes ?? 0;
      sqlResultMsg.value = `Success. Changes: ${changes}`;
      await refreshDbStats();
    }
  } catch (err: any) {
    sqlError.value = err.message || String(err);
  }
}

async function persistWebStore() {
  try {
    await databaseService.save();
    f7.toast.show({ text: '✅ Persisted SQLite to IndexedDB successfully!', closeTimeout: 2000 });
  } catch (err: any) {
    f7.dialog.alert('Save failed: ' + (err.message || String(err)), 'Error');
  }
}

function promptResetDb() {
  f7.dialog.confirm(
    'Are you sure you want to PURGE and RESET the local SQLite database? All offline data will be lost.',
    'Reset Local Database',
    async () => {
      try {
        await databaseService.resetDatabase();
        f7.toast.show({ text: '✅ Database has been reset!', closeTimeout: 2000 });
        await refreshDbStats();
        clearSqlOutput();
      } catch (err: any) {
        f7.dialog.alert('Reset failed: ' + (err.message || String(err)), 'Error');
      }
    }
  );
}

defineExpose({
  refreshDbStats
});

onMounted(() => {
  refreshDbStats();
});
</script>
