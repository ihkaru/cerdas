
export const TABLES_TABLE = `
CREATE TABLE IF NOT EXISTS tables (
    id TEXT PRIMARY KEY,
    app_id TEXT,
    name TEXT,
    description TEXT,
    fields TEXT, -- JSON (Renamed from schema)
    layout TEXT, -- JSON
    settings TEXT, -- JSON (icon, color, etc)
    icon TEXT,
    version INTEGER,
    version_policy TEXT DEFAULT 'accept_all', -- accept_all | warn | require_update
    synced_at TEXT
);
`;

export const ASSIGNMENTS_TABLE = `
CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    table_id TEXT, -- Renamed from form_id
    organization_id TEXT,
    supervisor_id TEXT,
    enumerator_id TEXT,
    prelist_data TEXT, -- JSON
    status TEXT,
    synced_at TEXT,
    external_id TEXT,
    created_at TEXT,
    updated_at TEXT
);
`;

export const RESPONSES_TABLE = `
CREATE TABLE IF NOT EXISTS responses (
    local_id TEXT PRIMARY KEY,
    server_id TEXT,
    assignment_id TEXT,
    parent_response_id TEXT,
    data TEXT, -- JSON
    schema_version INTEGER, -- Form version when this response was first created
    is_synced INTEGER DEFAULT 0,
    synced_at TEXT,
    created_at TEXT,
    updated_at TEXT
);
`;

export const SYNC_QUEUE_TABLE = `
CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY,
    action TEXT,
    table_name TEXT,
    record_id TEXT,
    payload TEXT,
    attempts INTEGER DEFAULT 0,
    created_at TEXT
);
`;

export const APPS_TABLE = `
CREATE TABLE IF NOT EXISTS apps (
    id TEXT PRIMARY KEY,
    slug TEXT,
    name TEXT,
    description TEXT,
    navigation TEXT, -- JSON
    view_configs TEXT, -- JSON (view configs co-located with navigation)
    version INTEGER,
    synced_at TEXT
);
`;

export const TABLE_VERSIONS_TABLE = `
CREATE TABLE IF NOT EXISTS table_versions (
    table_id TEXT,
    version INTEGER,
    fields TEXT,    -- JSON cached schema fields
    layout TEXT,    -- JSON cached layout
    cached_at TEXT,
    PRIMARY KEY (table_id, version)
);
`;

export const SCHEMA_VERSION = 14; // Renamed apps.views to apps.view_configs for Eloquent compat
