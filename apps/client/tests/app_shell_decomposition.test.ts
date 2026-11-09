import { describe, expect, it } from 'vitest';
import { computed, ref } from 'vue';
import { useAppViewResolver } from '../src/app/dashboard/composables/useAppViewResolver';

describe('Fase 3: Dekonstruksi AppShell.vue & Modular View Resolvers', () => {
    it('should resolve app-level view config when present in appViewConfigs', () => {
        const appViewConfigs = ref<Record<string, any>>({
            'custom_view_1': {
                id: 'custom_view_1',
                title: 'Data Responden Sakernas',
                type: 'deck',
                source: 'assignments'
            }
        });
        const appViews = ref<any[]>([]);
        const layout = ref<any>({ views: {} });
        const appName = ref('Sakernas November 2026');
        const routeViewId = computed(() => 'custom_view_1');
        const activeView = ref('custom_view_1');

        const { currentViewConfig, pageTitle, getAppViewConfig } = useAppViewResolver(
            appViewConfigs,
            appViews,
            layout,
            appName,
            routeViewId,
            activeView
        );

        const config = getAppViewConfig('custom_view_1');
        expect(config).not.toBeNull();
        expect(config?.id).toBe('custom_view_1');
        expect(config?.label).toBe('Data Responden Sakernas');
        expect(currentViewConfig.value?.id).toBe('custom_view_1');
        expect(pageTitle.value).toBe('Data Responden Sakernas');
    });

    it('should fallback to appViews DB array when not found in appViewConfigs', () => {
        const appViewConfigs = ref<Record<string, any>>({});
        const appViews = ref<any[]>([
            {
                id: 'db_view_abc',
                title: 'Daftar Sampel Blok',
                type: 'table',
                config: { source: 'blocks' }
            }
        ]);
        const layout = ref<any>({});
        const appName = ref('Sakernas 2026');
        const routeViewId = computed(() => 'db_view_abc');
        const activeView = ref('db_view_abc');

        const { currentViewConfig, pageTitle } = useAppViewResolver(
            appViewConfigs,
            appViews,
            layout,
            appName,
            routeViewId,
            activeView
        );

        expect(currentViewConfig.value).not.toBeNull();
        expect(currentViewConfig.value?.label).toBe('Daftar Sampel Blok');
        expect(pageTitle.value).toBe('Daftar Sampel Blok');
    });

    it('should fallback to legacy layout views if present', () => {
        const appViewConfigs = ref<Record<string, any>>({});
        const appViews = ref<any[]>([]);
        const layout = ref<any>({
            views: {
                'legacy_view': {
                    title: 'Legacy Deck View',
                    type: 'deck',
                    source: 'assignments'
                }
            }
        });
        const appName = ref('Sakernas 2026');
        const routeViewId = computed(() => 'legacy_view');
        const activeView = ref('legacy_view');

        const { currentViewConfig, pageTitle } = useAppViewResolver(
            appViewConfigs,
            appViews,
            layout,
            appName,
            routeViewId,
            activeView
        );

        expect(currentViewConfig.value?.label).toBe('Legacy Deck View');
        expect(pageTitle.value).toBe('Legacy Deck View');
    });

    it('should generate default fallback deck view when viewId is default and no configs exist', () => {
        const appViewConfigs = ref<Record<string, any>>({});
        const appViews = ref<any[]>([]);
        const layout = ref<any>({});
        const appName = ref('Survei Angkatan Kerja');
        const routeViewId = computed(() => 'default');
        const activeView = ref('default');

        const { currentViewConfig, pageTitle } = useAppViewResolver(
            appViewConfigs,
            appViews,
            layout,
            appName,
            routeViewId,
            activeView
        );

        expect(currentViewConfig.value).not.toBeNull();
        expect(currentViewConfig.value?.id).toBe('default');
        expect(currentViewConfig.value?.type).toBe('deck');
        expect(currentViewConfig.value?.label).toBe('Survei Angkatan Kerja');
        expect(pageTitle.value).toBe('Survei Angkatan Kerja');
    });

    it('should return null if specific unknown view requested', () => {
        const appViewConfigs = ref<Record<string, any>>({});
        const appViews = ref<any[]>([]);
        const layout = ref<any>({ views: { default: {} } });
        const appName = ref('Survei BPS');
        const routeViewId = computed(() => 'non_existent_view');
        const activeView = ref('non_existent_view');

        const { currentViewConfig } = useAppViewResolver(
            appViewConfigs,
            appViews,
            layout,
            appName,
            routeViewId,
            activeView
        );

        expect(currentViewConfig.value).toBeNull();
    });
});
