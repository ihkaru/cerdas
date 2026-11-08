import { computed, type ComputedRef, type Ref } from 'vue';

export interface ViewItemConfig {
    id: string;
    label: string;
    type?: string;
    config: any;
    [key: string]: any;
}

export function useAppViewResolver(
    appViewConfigs: Ref<Record<string, any> | undefined>,
    appViews: Ref<any[]>,
    layout: Ref<any>,
    appName: Ref<string>,
    routeViewId: ComputedRef<string | undefined>,
    activeView: Ref<string>
) {
    const getAppViewConfig = (viewId: string): ViewItemConfig | null => {
        // 1. App-level View Configs (co-located with navigation)
        if (appViewConfigs.value?.[viewId]) {
            const raw = appViewConfigs.value[viewId] as Record<string, unknown>;
            return {
                id: viewId,
                label: (raw.title || raw.name || raw.label || viewId) as string,
                type: raw.type as string | undefined,
                config: raw
            };
        }

        // 2. AppViews DB records
        const dbView = appViews.value?.find((v: Record<string, unknown>) => v.id === viewId || v.view_id === viewId);
        if (dbView) {
            return {
                id: viewId,
                label: (dbView.title || dbView.label || dbView.name || viewId) as string,
                type: dbView.type as string | undefined,
                config: (dbView as any).config || dbView
            };
        }

        // 3. Fallback to Legacy Layout Views
        if (layout.value?.views?.[viewId]) {
            const raw = layout.value.views[viewId] as Record<string, unknown>;
            return {
                id: viewId,
                label: (raw.title || viewId) as string,
                type: raw.type as string | undefined,
                config: raw
            };
        }

        return null;
    };

    const currentViewConfig = computed<ViewItemConfig | null>(() => {
        const viewId = routeViewId.value || 'default';
        const resolved = getAppViewConfig(viewId);
        if (resolved) return resolved;

        const hasAnyViews = (appViewConfigs.value && Object.keys(appViewConfigs.value).length > 0) || 
                             (appViews.value && appViews.value.length > 0) ||
                             (layout.value?.views && Object.keys(layout.value.views).length > 0);

        if (viewId === 'default' && !hasAnyViews) {
            return {
                id: 'default',
                label: appName.value || 'Assignments',
                type: 'deck',
                config: {
                    type: 'deck',
                    title: appName.value || 'Assignments',
                    groupBy: [],
                    deck: {
                        primaryHeaderField: 'name',
                        secondaryHeaderField: 'description',
                        imageField: null,
                        imageShape: 'square'
                    },
                    actions: ['open', 'delete']
                }
            };
        }

        return null;
    });

    const pageTitle = computed(() => {
        if (currentViewConfig.value) {
            return currentViewConfig.value.label || appName.value;
        }
        if (layout.value && layout.value.views && activeView.value) {
            const legacyView = layout.value.views[activeView.value];
            if (legacyView) return legacyView.title || appName.value;
        }
        return appName.value;
    });

    return {
        getAppViewConfig,
        currentViewConfig,
        pageTitle
    };
}
