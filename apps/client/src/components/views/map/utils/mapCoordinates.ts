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

export const getDeep = (target: any, p: string) => {
    if (!target) return undefined;
    return p.split('.').reduce((acc, part) => acc && acc[part], target);
};

export const resolvePrelist = (obj: any, path: string) => {
    let prelist = obj.prelist_data;
    if (typeof prelist === 'string') {
        try { prelist = JSON.parse(prelist); } catch { /* ignore */ }
    }
    const val = getDeep(typeof prelist === 'object' ? prelist : obj, path.replace('prelist_data.', ''));
    return val || '';
};

export const resolvePath = (obj: any, path: string) => {
    if (!obj || !path) return '';
    if (path.startsWith('prelist_data.')) {
        return resolvePrelist(obj, path);
    }
    const val = getDeep(obj, path) ||
        getDeep(obj.response_data, path) ||
        getDeep(obj.data, path) ||
        getDeep(obj.prelist_data, path);
    if (val !== undefined && val !== null && val !== '') return val;
    return '';
};

export const getCoordinates = (item: any, gpsCol: string): [number, number] | null => {
    const val = resolvePath(item, gpsCol);
    if (!val) return null;
    return parseLatLongString(val) ||
        parseGeoCoords(val) ||
        parseLatLongObject(val) ||
        parseLatLongArray(val);
};
