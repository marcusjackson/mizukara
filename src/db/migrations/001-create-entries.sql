-- Migration: 001-create-entries.sql
-- Description: Create entries table and indexes for MVP

-- Create entries table
CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  assigned_day TEXT NOT NULL,
  order_position INTEGER NOT NULL DEFAULT 0,
  is_deleted INTEGER NOT NULL DEFAULT 0
);

-- Index for day-based queries (primary access pattern)
CREATE INDEX IF NOT EXISTS idx_entries_assigned_day
  ON entries(assigned_day, is_deleted, order_position);

-- Index for soft delete filtering
CREATE INDEX IF NOT EXISTS idx_entries_is_deleted
  ON entries(is_deleted);

-- Set schema version
PRAGMA user_version = 1;