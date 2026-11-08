import { apiClient } from '../../../common/api/ApiClient';
import { statusLabel } from '../../../app/dashboard/utils/statusHelpers';
import { computed, isRef, type Ref } from 'vue';

export interface DeckOptions {
    title?: string;
    subtitle?: string;
    image?: string;
}

export interface PreparedDeckItem {
    id?: string;
    local_id?: string;
    status?: string;
    response_data?: unknown;
    prelist_data?: unknown;
    _parsedResponse: Record<string, unknown>;
    _parsedPrelist: Record<string, unknown>;
    _resolvedTitle: string | number;
    _resolvedSubtitle: string | number;
    _resolvedImage?: string;
    _dedupKey: string;
    [key: string]: unknown;
}

const CANDIDATE_ID_KEYS = [
    'external_id',
    'id_cetar_key',
    'no_usulan_perkimtan',
    'no_usulan',
    'nomor_usulan',
    'nik_pemohon',
    'nik',
    'no_kk',
    'id_responden',
    'id_penerima',
    'id_pelanggan'
];

/** Safely parse or cast data to object */
export function ensureObject(data: unknown): Record<string, unknown> {
    if (typeof data === 'string') {
        try { return JSON.parse(data); }
        catch { return {}; }
    }
    return (typeof data === 'object' && data !== null) ? data as Record<string, unknown> : {};
}

/** Recursively traverse object path */
function getDeep(target: unknown, path: string): unknown {
    if (!target || typeof target !== 'object' || !path) return undefined;
    return path.split('.').reduce((acc: unknown, part: string) => {
        if (acc && typeof acc === 'object') {
            return (acc as Record<string, unknown>)[part];
        }
        return undefined;
    }, target);
}

/** Robust path resolver supporting direct, response, prelist, and smart fallback lookups */
export function resolvePath(
    obj: unknown,
    responseData: Record<string, unknown>,
    prelistData: Record<string, unknown>,
    path?: string
): unknown {
    if (!path) return '';

    const prefixes = ['prelist_data.', 'response_data.', 'data.'];
    let cleanPath = path;
    for (const prefix of prefixes) {
        if (cleanPath.startsWith(prefix)) {
            cleanPath = cleanPath.substring(prefix.length);
            break;
        }
    }

    // 1. Direct path lookup on root object
    const directValue = getDeep(obj, cleanPath);
    if (directValue !== undefined && directValue !== null && directValue !== '') {
        return cleanPath === 'status' ? statusLabel(String(directValue)) : directValue;
    }

    // 2. Response data lookup (highest priority for user edits)
    const responseVal = getDeep(responseData, cleanPath);
    if (responseVal !== undefined && responseVal !== null && responseVal !== '') {
        return cleanPath === 'status' ? statusLabel(String(responseVal)) : responseVal;
    }

    // 3. Prelist data lookup
    const prelistVal = getDeep(prelistData, cleanPath);
    if (prelistVal !== undefined && prelistVal !== null && prelistVal !== '') {
        return cleanPath === 'status' ? statusLabel(String(prelistVal)) : prelistVal;
    }

    // 4. Smart fallbacks for standard keys
    const lowerPath = cleanPath.toLowerCase();
    if (['name', 'title', 'nama', 'judul'].includes(lowerPath)) {
        const headerCandidates = ['name', 'nama', 'title', 'judul', 'label', 'id'];
        for (const candidate of headerCandidates) {
            if (candidate === cleanPath) continue;
            const val = getDeep(responseData, candidate) ?? getDeep(prelistData, candidate) ?? getDeep(obj, candidate);
            if (val !== undefined && val !== null && val !== '') return val;
        }
    } else if (['description', 'deskripsi', 'address', 'alamat'].includes(lowerPath)) {
        const bodyCandidates = ['description', 'deskripsi', 'address', 'alamat', 'location', 'lokasi', 'status'];
        for (const candidate of bodyCandidates) {
            if (candidate === cleanPath) continue;
            const val = getDeep(responseData, candidate) ?? getDeep(prelistData, candidate) ?? getDeep(obj, candidate);
            if (val !== undefined && val !== null && val !== '') {
                return candidate === 'status' ? statusLabel(String(val)) : val;
            }
        }
    }

    return '';
}

/** Extract deck header/image options from nested or flat configs */
export function extractDeckOptions(config: unknown): DeckOptions {
    const findBlock = (root: unknown, targetKeys: string[]): Record<string, unknown> | null => {
        if (!root || typeof root !== 'object') return null;
        const obj = root as Record<string, unknown>;
        if (targetKeys.some(k => k in obj)) return obj;
        if (obj.deck && typeof obj.deck === 'object') return obj.deck as Record<string, unknown>;
        if (obj.config) return findBlock(obj.config, targetKeys);
        if (obj.options) return findBlock(obj.options, targetKeys);
        return null;
    };

    const targetKeys = ['primaryHeaderField', 'title_column', 'imageField', 'image_column'];
    const deck = findBlock(config, targetKeys) || {};

    const title = (deck.primaryHeaderField || deck.title_column) as string | undefined;
    const subtitle = (deck.secondaryHeaderField || deck.subtitle_column) as string | undefined;
    const image = (deck.imageField || deck.image_column) as string | undefined;

    return { title, subtitle, image };
}

/** Composable for deck data resolution, robust deduplication, and asset URLs */
export function useDeckData(
    configRef: Ref<unknown> | unknown,
    dataRef: Ref<unknown[]> | unknown[],
    contextIdRef: Ref<string> | string
) {
    const getConfig = () => isRef(configRef) ? configRef.value : configRef;
    const getData = () => (isRef(dataRef) ? dataRef.value : dataRef) as unknown[] || [];
    const getContextId = () => isRef(contextIdRef) ? contextIdRef.value : contextIdRef;

    const options = computed<DeckOptions>(() => extractDeckOptions(getConfig()));

    const preparedData = computed<PreparedDeckItem[]>(() => {
        const opts = options.value;
        const rawItems = getData();

        const mapped: PreparedDeckItem[] = rawItems.map((rawItem: unknown) => {
            const item = (rawItem || {}) as Record<string, unknown>;
            const responseData = ensureObject(item.response_data);
            const prelistData = ensureObject(item.prelist_data);

            let resolvedTitle = resolvePath(item, responseData, prelistData, opts.title);
            let resolvedSubtitle = resolvePath(item, responseData, prelistData, opts.subtitle);

            // Defensive string coercion to prevent fatal TypeError when headers are numbers/booleans
            const strTitle = resolvedTitle !== undefined && resolvedTitle !== null ? String(resolvedTitle).trim() : '';
            const strSubtitle = resolvedSubtitle !== undefined && resolvedSubtitle !== null ? String(resolvedSubtitle).trim() : '';

            if (!strTitle) {
                resolvedTitle = 'Draf Baru - Belum Diisi';
            }
            if (!strSubtitle) {
                resolvedSubtitle = `Status: ${statusLabel(String(item.status || 'assigned'))}`;
            }

            // Determine deduplication key
            let dedupKey: string | null = null;
            for (const k of CANDIDATE_ID_KEYS) {
                const val = responseData[k] ?? prelistData[k];
                if (val !== undefined && val !== null && String(val).trim() !== '') {
                    dedupKey = `k_${k}_${String(val).trim()}`;
                    break;
                }
            }

            const safeTitle = String(resolvedTitle).trim();
            const safeSubtitle = String(resolvedSubtitle).trim();

            // Composite fallback for cluster + ordinal (e.g. kode_sls + nus)
            if (!dedupKey && (prelistData.kode_sls || prelistData.sls) && prelistData.nus !== undefined) {
                const cluster = prelistData.kode_sls ?? prelistData.sls;
                dedupKey = `k_cluster_${String(cluster).trim()}_nus_${String(prelistData.nus).trim()}`;
            }
            if (!dedupKey && item.id) {
                dedupKey = `raw_${item.id}`;
            }
            if (!dedupKey && safeTitle && !safeTitle.startsWith('Draf Baru')) {
                dedupKey = `title_${safeTitle.toLowerCase()}__${safeSubtitle.toLowerCase()}`;
            }
            if (!dedupKey) {
                dedupKey = `raw_${item.local_id || Math.random()}`;
            }

            const resolvedImage = resolvePath(item, responseData, prelistData, opts.image);

            return {
                ...item,
                _parsedResponse: responseData,
                _parsedPrelist: prelistData,
                _resolvedTitle: resolvedTitle as string | number,
                _resolvedSubtitle: resolvedSubtitle as string | number,
                _resolvedImage: resolvedImage ? String(resolvedImage) : undefined,
                _dedupKey: dedupKey
            };
        });

        // Deduplicate: Submitted/Approved takes precedence over pending
        const dedupMap = new Map<string, PreparedDeckItem>();
        for (const card of mapped) {
            const key = card._dedupKey;
            if (!dedupMap.has(key)) {
                dedupMap.set(key, card);
                continue;
            }

            const existing = dedupMap.get(key)!;
            const getScore = (c: PreparedDeckItem): number => {
                if (['submitted', 'verified', 'approved', 'synced', 'completed'].includes(String(c.status))) return 3;
                if (c.status === 'in_progress') return 2;
                return 1;
            };

            if (getScore(card) > getScore(existing)) {
                dedupMap.set(key, card);
            }
        }

        return Array.from(dedupMap.values());
    });

    const getImageUrl = (item: unknown, path: string): string => {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
            return path;
        }

        let finalPath = path;
        if (!path.includes('/')) {
            const it = (item || {}) as Record<string, unknown>;
            const assignmentId = it.uuid || it.id || 'shared';
            finalPath = `responses/${getContextId()}/${assignmentId}/${path}`;
        }
        return apiClient.getAssetUrl(finalPath);
    };

    return {
        options,
        preparedData,
        getImageUrl
    };
}
