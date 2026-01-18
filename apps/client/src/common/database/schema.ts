

export const FORMS_TABLE = `
CREATE TABLE IF NOT EXISTS forms (
    id TEXT PRIMARY KEY,
    app_id TEXT,
    name TEXT,
    description TEXT,
    schema TEXT, -- JSON
    layout TEXT, -- JSON
    settings TEXT, -- JSON (icon, color, etc)
    icon TEXT,
    version INTEGER,
    synced_at TEXT
);
`;

export const ASSIGNMENTS_TABLE = `
CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    form_id TEXT,
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
    views TEXT, -- JSON
    version INTEGER,
    synced_at TEXT
);
`;

export const SCHEMA_VERSION = 8; // Added icon column to forms table
