import { apiClient } from '../../../common/api/ApiClient';
import { statusLabel } from '../../../app/dashboard/utils/statusHelpers';
import { generateUUID } from '../../../common/utils/uuid';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';

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

const HEADER_CANDIDATES = ['name', 'nama', 'title', 'judul', 'label', 'id'];
const BODY_CANDIDATES = ['description', 'deskripsi', 'address', 'alamat', 'location', 'lokasi', 'status'];

function findCandidateValue(
    candidates: string[],
    cleanPath: string,
    obj: unknown,
    responseData: Record<string, unknown>,
    prelistData: Record<string, unknown>
): unknown {
    for (const candidate of candidates) {
        if (candidate === cleanPath) continue;
        const val = getDeep(responseData, candidate) ?? getDeep(prelistData, candidate) ?? getDeep(obj, candidate);
        if (val !== undefined && val !== null && val !== '') return val;
    }
    return undefined;
}

/** Fallback search across standard header and body field candidates */
function resolveStandardFallback(
    cleanPath: string,
    lowerPath: string,
    obj: unknown,
    responseData: Record<string, unknown>,
    prelistData: Record<string, unknown>
): unknown {
    if (['name', 'title', 'nama', 'judul'].includes(lowerPath)) {
        const val = findCandidateValue(HEADER_CANDIDATES, cleanPath, obj, responseData, prelistData);
        if (val !== undefined) return val;
    } else if (['description', 'deskripsi', 'address', 'alamat'].includes(lowerPath)) {
        const val = findCandidateValue(BODY_CANDIDATES, cleanPath, obj, responseData, prelistData);
        if (val !== undefined) {
            return cleanPath === 'status' ? statusLabel(String(val)) : val;
        }
    }
    return '';
}

function stripPrefix(path: string): string {
    const prefixes = ['prelist_data.', 'response_data.', 'data.'];
    for (const prefix of prefixes) {
        if (path.startsWith(prefix)) return path.substring(prefix.length);
    }
    return path;
}

/** Robust path resolver supporting direct, response, prelist, and smart fallback lookups */
export function resolvePath(
    obj: unknown,
    responseData: Record<string, unknown>,
    prelistData: Record<string, unknown>,
    path?: string
): unknown {
    if (!path) return '';

    const cleanPath = stripPrefix(path);

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
    return resolveStandardFallback(cleanPath, cleanPath.toLowerCase(), obj, responseData, prelistData);
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

/** Determine deduplication key for cards */
function resolveDedupKey(
    item: Record<string, unknown>,
    responseData: Record<string, unknown>,
    prelistData: Record<string, unknown>,
    safeTitle: string,
    safeSubtitle: string
): string {
    for (const k of CANDIDATE_ID_KEYS) {
        const val = responseData[k] ?? prelistData[k];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
            return `k_${k}_${String(val).trim()}`;
        }
    }

    if ((prelistData.kode_sls || prelistData.sls) && prelistData.nus !== undefined) {
        const cluster = prelistData.kode_sls ?? prelistData.sls;
        return `k_cluster_${String(cluster).trim()}_nus_${String(prelistData.nus).trim()}`;
    }

    if (item.id) {
        return `raw_${item.id}`;
    }

    if (safeTitle && !safeTitle.startsWith('Draf Baru')) {
        return `title_${safeTitle.toLowerCase()}__${safeSubtitle.toLowerCase()}`;
    }

    return `raw_${String(item.local_id || generateUUID())}`;
}

/** Map raw assignment item to prepared deck item */
function mapDeckItem(rawItem: unknown, opts: DeckOptions): PreparedDeckItem {
    const item = (rawItem || {}) as Record<string, unknown>;
    const responseData = ensureObject(item.response_data);
    const prelistData = ensureObject(item.prelist_data);

    let resolvedTitle = resolvePath(item, responseData, prelistData, opts.title);
    let resolvedSubtitle = resolvePath(item, responseData, prelistData, opts.subtitle);

    const strTitle = resolvedTitle !== undefined && resolvedTitle !== null ? String(resolvedTitle).trim() : '';
    const strSubtitle = resolvedSubtitle !== undefined && resolvedSubtitle !== null ? String(resolvedSubtitle).trim() : '';

    if (!strTitle) {
        resolvedTitle = 'Draf Baru - Belum Diisi';
    }
    if (!strSubtitle) {
        resolvedSubtitle = `Status: ${statusLabel(String(item.status || 'assigned'))}`;
    }

    const safeTitle = String(resolvedTitle).trim();
    const safeSubtitle = String(resolvedSubtitle).trim();
    const dedupKey = resolveDedupKey(item, responseData, prelistData, safeTitle, safeSubtitle);
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
}

/** Score card status priority: finalized > in_progress > assigned */
function getCardStatusScore(status?: string): number {
    if (['submitted', 'verified', 'approved', 'synced', 'completed'].includes(String(status))) return 3;
    if (status === 'in_progress') return 2;
    return 1;
}

/** Composable for deck data resolution, robust deduplication, and asset URLs */
export function useDeckData(
    configRef: MaybeRefOrGetter<unknown>,
    dataRef: MaybeRefOrGetter<unknown[]>,
    contextIdRef: MaybeRefOrGetter<string>
) {
    const getConfig = () => toValue(configRef);
    const getData = () => (toValue(dataRef) as unknown[]) || [];
    const getContextId = () => toValue(contextIdRef);

    const options = computed<DeckOptions>(() => extractDeckOptions(getConfig()));

    const preparedData = computed<PreparedDeckItem[]>(() => {
        const opts = options.value;
        const rawItems = getData();
        const mapped = rawItems.map((rawItem: unknown) => mapDeckItem(rawItem, opts));

        // Deduplicate: Submitted/Approved takes precedence over pending
        const dedupMap = new Map<string, PreparedDeckItem>();
        for (const card of mapped) {
            const key = card._dedupKey;
            const existing = dedupMap.get(key);
            if (!existing) {
                dedupMap.set(key, card);
                continue;
            }

            if (getCardStatusScore(card.status) > getCardStatusScore(existing.status)) {
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
