-- Migration: 002-create-tags.sql
-- Description: Create tags and entry_tags tables for the tags feature

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  is_deleted INTEGER NOT NULL DEFAULT 0
);

-- Index for case-insensitive uniqueness checks and name-based lookups
CREATE INDEX IF NOT EXISTS idx_tags_name
  ON tags(name, is_deleted);

-- Create entry_tags join table
CREATE TABLE IF NOT EXISTS entry_tags (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (entry_id) REFERENCES entries(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);

-- Index for "tags for this entry" lookups (editor and card views)
CREATE INDEX IF NOT EXISTS idx_entry_tags_entry_id
  ON entry_tags(entry_id, is_deleted);

-- Index for "entries for this tag" filter and cascade soft-delete
CREATE INDEX IF NOT EXISTS idx_entry_tags_tag_id
  ON entry_tags(tag_id, is_deleted);

-- Set schema version
PRAGMA user_version = 2;
