-- Migration: 003-tags-name-unique-index.sql
-- Description: Add partial unique index to enforce case-insensitive tag name uniqueness
-- among non-deleted tags.
--
-- A partial index (WHERE is_deleted = 0) allows soft-deleted tags to share names
-- with active ones, supporting future restore scenarios.
--
-- LOWER(name) is used for consistency with the application-layer uniqueness check
-- in assertNameUnique() (tag-mutations.ts), which also uses LOWER().

CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name_active_unique
  ON tags (LOWER(name))
  WHERE is_deleted = 0;

PRAGMA user_version = 3;
