CREATE TABLE IF NOT EXISTS blocklist (
    origin TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_blocklist_origin ON webmentions(origin);
