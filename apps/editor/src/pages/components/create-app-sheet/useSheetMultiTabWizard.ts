import { ref, computed } from 'vue';
import { GoogleSheetApi } from '@/common/api/GoogleSheetApi';
import type {
  GoogleSheetInferredColumn,
  GoogleSheetWorkbookMeta,
  SheetTabProvisionConfig,
} from '@cerdas/types';

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const maybeAxios = err as { response?: { data?: { message?: string } } };
    if (maybeAxios.response?.data?.message) {
      return maybeAxios.response.data.message;
    }
  }
  return err instanceof Error ? err.message : fallback;
}

function findBestKeyColumn(columns: GoogleSheetInferredColumn[], suggestedKey?: string): string {
  if (suggestedKey && suggestedKey !== '_cerdas_id') {
    return suggestedKey;
  }

  const priorityKeys = [
    'no_usulan_perkimtan',
    'no_usulan',
    'nomor_usulan',
    'nik_pemohon',
    'nik',
    'no_kk',
    'id_responden',
    'id_penerima',
    'id',
    'uuid',
  ];

  for (const p of priorityKeys) {
    const match = columns.find((c) => c.name.toLowerCase() === p);
    if (match) return match.name;
  }

  const heuristic = columns.find((c) => {
    const s = c.name.toLowerCase();
    return s.startsWith('no_') || s.startsWith('nomor_') || s.includes('nik') || s.includes('id') || s.includes('kode');
  });

  return heuristic?.name || '_cerdas_id';
}

/**
 * useSheetMultiTabWizard
 *
 * Clean Frontend composable managing state and workflows for multi-tab
 * Google Spreadsheet introspection, tab selection, per-tab schema inspection,
 * and batch provisioning.
 *
 * Adheres to Interface-First and Decoupled Presentation Architecture.
 */
export function useSheetMultiTabWizard() {
  const spreadsheetUrl = ref('');
  const isInspectingWorkbook = ref(false);
  const isLoadingTabSchema = ref(false);
  const isCreatingApp = ref(false);
  const inspectError = ref<string | null>(null);

  const workbookMeta = ref<GoogleSheetWorkbookMeta | null>(null);
  const availableSheets = computed(() => workbookMeta.value?.sheets ?? []);

  // Set of selected tab names (at least 1 must be selected)
  const selectedTabs = ref<string[]>([]);

  // Mapping of sheet_name -> Table Name
  const tableNames = ref<Record<string, string>>({});

  // Per-tab schema caches
  const tabSchemas = ref<Record<string, GoogleSheetInferredColumn[]>>({});
  const tabKeyColumns = ref<Record<string, string>>({});
  const tabPreviews = ref<Record<string, Array<Array<unknown>>>>({});

  // Active tab displayed in Step 3 review
  const activeReviewTab = ref<string>('');

  /**
   * Introspect workbook to fetch spreadsheet title and sheet tab names.
   */
  async function inspectWorkbook(appId: string): Promise<boolean> {
    const url = spreadsheetUrl.value.trim();
    if (!url) return false;

    try {
      isInspectingWorkbook.value = true;
      inspectError.value = null;

      const meta = await GoogleSheetApi.inspectWorkbook(appId, {
        spreadsheet_url: url,
      });

      workbookMeta.value = meta;

      // Initialize defaults: by default, select all available tabs (or first if many)
      if (meta.sheets && meta.sheets.length > 0) {
        selectedTabs.value = [...meta.sheets];
        const names: Record<string, string> = {};
        for (const s of meta.sheets) {
          names[s] = s;
        }
        tableNames.value = names;
        activeReviewTab.value = meta.sheets[0] ?? '';
      }
      return true;
    } catch (err: unknown) {
      inspectError.value = extractErrorMessage(err, 'Gagal membaca metadata Google Spreadsheet.');
      return false;
    } finally {
      isInspectingWorkbook.value = false;
    }
  }

  /**
   * Toggle a tab's selected state.
   */
  function toggleTab(tabName: string) {
    const idx = selectedTabs.value.indexOf(tabName);
    if (idx >= 0) {
      // Don't allow deselecting if it's the last one
      if (selectedTabs.value.length <= 1) return;
      selectedTabs.value.splice(idx, 1);
      // If we deselected the currently active review tab, switch to another
      if (activeReviewTab.value === tabName && selectedTabs.value.length > 0) {
        activeReviewTab.value = selectedTabs.value[0] ?? '';
      }
    } else {
      selectedTabs.value.push(tabName);
      if (!tableNames.value[tabName]) {
        tableNames.value[tabName] = tabName;
      }
    }
  }

  function selectAllTabs() {
    selectedTabs.value = [...availableSheets.value];
    for (const s of availableSheets.value) {
      if (!tableNames.value[s]) {
        tableNames.value[s] = s;
      }
    }
  }

  function selectOnlyTab(tabName: string) {
    selectedTabs.value = [tabName];
    activeReviewTab.value = tabName;
    if (!tableNames.value[tabName]) {
      tableNames.value[tabName] = tabName;
    }
  }

  /**
   * Fetch schema for a specific tab if not already cached.
   */
  async function ensureTabSchema(appId: string, tabName: string): Promise<boolean> {
    const cached = tabSchemas.value[tabName];
    if (cached && cached.length > 0) {
      return true;
    }

    try {
      isLoadingTabSchema.value = true;
      inspectError.value = null;

      const res = await GoogleSheetApi.inspectSchema(appId, {
        spreadsheet_url: spreadsheetUrl.value.trim(),
        sheet_name: tabName,
      });

      tabSchemas.value[tabName] = res.columns;
      tabKeyColumns.value[tabName] = res.suggested_key || '_cerdas_id';
      tabPreviews.value[tabName] = res.preview;

      return true;
    } catch (err: unknown) {
      inspectError.value = extractErrorMessage(err, `Gagal memeriksa skema tab '${tabName}'.`);
      return false;
    } finally {
      isLoadingTabSchema.value = false;
    }
  }

  /**
   * Preload schemas for all currently selected tabs before proceeding to Step 3.
   */
  async function loadAllSelectedSchemas(appId: string): Promise<boolean> {
    if (selectedTabs.value.length === 0) return false;

    // Set first selected tab as active
    if (!selectedTabs.value.includes(activeReviewTab.value)) {
      activeReviewTab.value = selectedTabs.value[0] ?? '';
    }

    isLoadingTabSchema.value = true;
    inspectError.value = null;

    try {
      for (const tab of selectedTabs.value) {
        const cached = tabSchemas.value[tab];
        if (!cached || cached.length === 0) {
          const res = await GoogleSheetApi.inspectSchema(appId, {
            spreadsheet_url: spreadsheetUrl.value.trim(),
            sheet_name: tab,
          });
          tabSchemas.value[tab] = res.columns;
          tabKeyColumns.value[tab] = findBestKeyColumn(res.columns, res.suggested_key);
          tabPreviews.value[tab] = res.preview;
        }
      }
      return true;
    } catch (err: unknown) {
      inspectError.value = extractErrorMessage(err, 'Gagal memuat skema kolom lembar kerja.');
      return false;
    } finally {
      isLoadingTabSchema.value = false;
    }
  }

  /**
   * Build the structured array payload for batch table provisioning.
   */
  function buildTabsPayload(): SheetTabProvisionConfig[] {
    return selectedTabs.value.map((tab) => ({
      sheet_name: tab,
      table_name: tableNames.value[tab]?.trim() || tab,
      columns: tabSchemas.value[tab] || [],
      key_column: tabKeyColumns.value[tab] || '_cerdas_id',
    }));
  }

  return {
    spreadsheetUrl,
    isInspectingWorkbook,
    isLoadingTabSchema,
    isCreatingApp,
    inspectError,
    workbookMeta,
    availableSheets,
    selectedTabs,
    tableNames,
    tabSchemas,
    tabKeyColumns,
    tabPreviews,
    activeReviewTab,
    inspectWorkbook,
    toggleTab,
    selectAllTabs,
    selectOnlyTab,
    ensureTabSchema,
    loadAllSelectedSchemas,
    buildTabsPayload,
  };
}
