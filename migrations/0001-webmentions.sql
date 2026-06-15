CREATE TABLE IF NOT EXISTS webmentions (
    source TEXT NOT NULL,
    target TEXT NOT NULL,
    type TEXT CHECK(type IN ('comment', 'mention', 'reaction', 'repost', 'bookmark')) NOT NULL DEFAULT 'mention',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT DEFAULT NULL,
    deleted_at TEXT DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_webmentions_not_deleted ON webmentions(deleted_at) WHERE deleted_at IS NULL;
