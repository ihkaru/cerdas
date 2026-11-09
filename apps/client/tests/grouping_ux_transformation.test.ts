import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { useGroupingLogic } from '../src/app/dashboard/composables/app-shell/useGroupingLogic';

describe('Fase 2: UX Transformation for Grouping & Hierarchy - Unit Tests', () => {
    describe('useGroupingLogic navigation and state', () => {
        it('should correctly report hasGroupingConfig', () => {
            const activeView = ref('view_1');
            const appViews = ref([
                { id: 'view_1', groupBy: ['kecamatan', 'desa'] }
            ]);
            const layout = ref(null);
            const schemaData = ref(null);
            const searchQuery = ref('');
            let changedCount = 0;

            const grouping = useGroupingLogic(
                activeView,
                appViews,
                layout,
                schemaData,
                searchQuery,
                'table_1',
                () => { changedCount++; }
            );

            expect(grouping.hasGroupingConfig.value).toBe(true);
            expect(grouping.groupByConfig.value?.levels?.length).toBe(2);
            expect(grouping.currentGroupLevel.value).toBe(0);
            expect(grouping.isGroupingActive.value).toBe(true);
            expect(grouping.currentGroupField.value).toBe('kecamatan');
        });

        it('should report hasGroupingConfig as false when groupBy is empty', () => {
            const activeView = ref('view_empty');
            const appViews = ref([
                { id: 'view_empty', groupBy: [] }
            ]);
            const layout = ref(null);
            const schemaData = ref(null);
            const searchQuery = ref('');

            const grouping = useGroupingLogic(
                activeView,
                appViews,
                layout,
                schemaData,
                searchQuery,
                'table_1',
                () => {}
            );

            expect(grouping.hasGroupingConfig.value).toBe(false);
            expect(grouping.isGroupingActive.value).toBe(false);
            expect(grouping.currentGroupField.value).toBeNull();
        });

        it('should navigate into sub-groups and update currentGroupLevel & currentGroupField', () => {
            const activeView = ref('view_1');
            const appViews = ref([
                { id: 'view_1', groupBy: ['kecamatan', 'desa'] }
            ]);
            const layout = ref(null);
            const schemaData = ref(null);
            const searchQuery = ref('');
            let callbackFired = 0;

            const grouping = useGroupingLogic(
                activeView,
                appViews,
                layout,
                schemaData,
                searchQuery,
                'table_1',
                () => { callbackFired++; }
            );

            // Level 0 -> Enter Mempawah Timur
            grouping.enterGroup('Mempawah Timur');
            expect(grouping.groupPath.value).toEqual(['Mempawah Timur']);
            expect(grouping.currentGroupLevel.value).toBe(1);
            expect(grouping.currentGroupField.value).toBe('desa');
            expect(grouping.isGroupingActive.value).toBe(true);
            expect(callbackFired).toBe(1);

            // Level 1 -> Enter Parit Banjar (leaf reached)
            grouping.enterGroup('Parit Banjar');
            expect(grouping.groupPath.value).toEqual(['Mempawah Timur', 'Parit Banjar']);
            expect(grouping.currentGroupLevel.value).toBe(2);
            expect(grouping.isGroupingActive.value).toBe(false); // Past all 2 levels -> leaf view
            expect(callbackFired).toBe(2);
        });

        it('should navigate up one level correctly via navigateUp', () => {
            const activeView = ref('view_1');
            const appViews = ref([
                { id: 'view_1', groupBy: ['kecamatan', 'desa'] }
            ]);
            const layout = ref(null);
            const schemaData = ref(null);
            const searchQuery = ref('');

            const grouping = useGroupingLogic(
                activeView,
                appViews,
                layout,
                schemaData,
                searchQuery,
                'table_1',
                () => {}
            );

            grouping.enterGroup('Mempawah Timur');
            grouping.enterGroup('Parit Banjar');
            expect(grouping.groupPath.value.length).toBe(2);

            // Navigate up once -> back to Mempawah Timur
            const handled1 = grouping.navigateUp();
            expect(handled1).toBe(true);
            expect(grouping.groupPath.value).toEqual(['Mempawah Timur']);
            expect(grouping.currentGroupLevel.value).toBe(1);

            // Navigate up again -> back to root
            const handled2 = grouping.navigateUp();
            expect(handled2).toBe(true);
            expect(grouping.groupPath.value).toEqual([]);
            expect(grouping.currentGroupLevel.value).toBe(0);

            // Navigate up at root -> returns false (delegates to parent router)
            const handled3 = grouping.navigateUp();
            expect(handled3).toBe(false);
        });

        it('should jump to arbitrary breadcrumb levels via navigateToLevel', () => {
            const activeView = ref('view_1');
            const appViews = ref([
                { id: 'view_1', groupBy: ['provinsi', 'kabupaten', 'kecamatan', 'desa'] }
            ]);
            const layout = ref(null);
            const schemaData = ref(null);
            const searchQuery = ref('');

            const grouping = useGroupingLogic(
                activeView,
                appViews,
                layout,
                schemaData,
                searchQuery,
                'table_1',
                () => {}
            );

            // Drill down 4 levels
            grouping.enterGroup('Kalbar');
            grouping.enterGroup('Mempawah');
            grouping.enterGroup('Mempawah Timur');
            grouping.enterGroup('Parit Banjar');
            expect(grouping.groupPath.value.length).toBe(4);

            // Jump back to index 1 (Mempawah)
            grouping.navigateToLevel(1);
            expect(grouping.groupPath.value).toEqual(['Kalbar', 'Mempawah']);
            expect(grouping.currentGroupLevel.value).toBe(2);

            // Jump to root via index -1 ("Semua")
            grouping.navigateToLevel(-1);
            expect(grouping.groupPath.value).toEqual([]);
            expect(grouping.currentGroupLevel.value).toBe(0);
        });

        it('should handle forceShowItems toggle cleanly', () => {
            const activeView = ref('view_1');
            const appViews = ref([
                { id: 'view_1', groupBy: ['kecamatan', 'desa'] }
            ]);
            const layout = ref(null);
            const schemaData = ref(null);
            const searchQuery = ref('');

            const grouping = useGroupingLogic(
                activeView,
                appViews,
                layout,
                schemaData,
                searchQuery,
                'table_1',
                () => {}
            );

            expect(grouping.isGroupingActive.value).toBe(true);

            // User clicks "Lihat Semua / Flat Mode"
            grouping.forceShowItems.value = true;
            expect(grouping.isGroupingActive.value).toBe(false);

            // navigateUp in forceShowItems resets forceShowItems first
            const handled = grouping.navigateUp();
            expect(handled).toBe(true);
            expect(grouping.forceShowItems.value).toBe(false);
            expect(grouping.isGroupingActive.value).toBe(true);
        });

        it('should disable grouping when active search query is present', () => {
            const activeView = ref('view_1');
            const appViews = ref([
                { id: 'view_1', groupBy: ['kecamatan'] }
            ]);
            const layout = ref(null);
            const schemaData = ref(null);
            const searchQuery = ref('');

            const grouping = useGroupingLogic(
                activeView,
                appViews,
                layout,
                schemaData,
                searchQuery,
                'table_1',
                () => {}
            );

            expect(grouping.isGroupingActive.value).toBe(true);

            // Surveyor types search query
            searchQuery.value = 'Kurniawati';
            expect(grouping.isGroupingActive.value).toBe(false);

            // Surveyor clears search query
            searchQuery.value = '';
            expect(grouping.isGroupingActive.value).toBe(true);
        });
    });

    describe('Breadcrumb & Field Label Formatting', () => {
        it('should format snake_case field names into title case words', () => {
            const formatField = (field: string | null) => {
                if (!field) return 'Wilayah';
                return field
                    .split('_')
                    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                    .join(' ');
            };

            expect(formatField('nama_kecamatan')).toBe('Nama Kecamatan');
            expect(formatField('desa')).toBe('Desa');
            expect(formatField('kode_sls')).toBe('Kode Sls');
            expect(formatField(null)).toBe('Wilayah');
        });
    });
});
