export const toNum = (v: any): number => {
    const n = parseFloat(String(v));
    return isNaN(n) ? NaN : n;
};

export const parseLatLongString = (val: any): [number, number] | null => {
    if (typeof val !== 'string') return null;
    const parts = val.includes(',') ? val.split(',') : val.trim().split(/\s+/);
    const [latStr, lngStr] = parts;
    if (!latStr || !lngStr) return null;
    const lat = toNum(latStr.trim());
    const lng = toNum(lngStr.trim());
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
    return null;
};

export const parseGeoCoords = (val: any): [number, number] | null => {
    if (val?.coords) {
        const lat = toNum(val.coords.latitude), lng = toNum(val.coords.longitude);
        if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
    }
    return null;
};

export const parseLatLongObject = (val: any): [number, number] | null => {
    if (typeof val === 'object' && !Array.isArray(val)) {
        const lat = toNum(val.lat ?? val.latitude);
        const lng = toNum(val.lng ?? val.long ?? val.longitude);
        if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
    }
    return null;
};

export const parseLatLongArray = (val: any): [number, number] | null => {
    if (Array.isArray(val) && val.length >= 2) {
        const lat = toNum(val[0]), lng = toNum(val[1]);
        if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
    }
    return null;
};

export const getDeep = (target: any, p: string): any => {
    if (!target || !p) return undefined;
    
    // Support both dot notation and simple keys
    if (!p.includes('.')) return target[p];
    
    return p.split('.').reduce((acc, part) => {
        if (acc === null || acc === undefined) return undefined;
        return acc[part];
    }, target);
};

    /* eslint-disable-next-line sonarjs/cognitive-complexity */
export const resolvePath = (obj: any, path: string): any => {
    if (!obj || !path) return '';

    // Standard field prefixes
    const prefixes = ['prelist_data.', 'response_data.', 'data.'];
    let cleanPath = path;
    for (const prefix of prefixes) {
        if (path.startsWith(prefix)) {
            const val = getDeep(obj, path);
            if (val !== undefined && val !== null && val !== '') return val;
            cleanPath = path.substring(prefix.length);
        }
    }

    // Helper to ensure we have an object to search in
    const ensureObj = (val: any) => {
        if (typeof val === 'string' && val.trim().startsWith('{')) {
            try { return JSON.parse(val); } catch { return {}; }
        }
        return (typeof val === 'object' && val !== null) ? val : {};
    };

    const resp = ensureObj(obj.response_data || obj.data);
    const prelist = ensureObj(obj.prelist_data);

    const direct = getDeep(obj, cleanPath);
    const respVal = getDeep(resp, cleanPath);
    const prelistVal = getDeep(prelist, cleanPath);

    // FIX: Avoid nested ternaries to satisfy sonarjs/no-nested-conditional
    let result = (direct !== undefined && direct !== null && direct !== '') ? direct : '';
    if (!result) {
        result = (respVal !== undefined && respVal !== null && respVal !== '') ? respVal : '';
    }
    if (!result) {
        result = (prelistVal !== undefined && prelistVal !== null && prelistVal !== '') ? prelistVal : '';
    }


    if (!result && path !== 'undefined') {
        // Only log if potentially a real field we care about
        console.log(`[DIAGNOSTIC] resolvePath FAILED: path=${path}, clean=${cleanPath}, found: direct=${!!direct}, resp=${!!respVal}, prelist=${!!prelistVal}`);
    }

    return result;
};

export const getCoordinates = (item: any, gpsCol: string): [number, number] | null => {
    if (!item || !gpsCol) return null;
    const val = resolvePath(item, gpsCol);
    if (!val) return null;
    
    return parseLatLongString(val) ||
        parseGeoCoords(val) ||
        parseLatLongObject(val) ||
        parseLatLongArray(val);
};
