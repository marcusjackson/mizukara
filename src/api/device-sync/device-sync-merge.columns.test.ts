/**
 * Checks the hand-maintained synced column lists against the real schema, so a column added
 * by a future migration cannot silently stop syncing.
 */

import {
  createTestDatabaseForEntries,
  seedEntry,
  seedEntryTag,
  seedTag,
} from '@test/helpers/database';
import { describe, expect, it, vi } from 'vitest';

import { applySyncPayload } from './device-sync-merge';
import { serializeDatabase } from './device-sync-serialize';

import type { Database } from 'sql.js';

vi.mock('@/db/indexeddb', () => ({
  schedulePersist: vi.fn(),
}));

const SYNCED_TABLES = ['entries', 'tags', 'entry_tags'] as const;

function tableColumns(db: Database, table: string): string[] {
  const rows = db.exec(`PRAGMA table_info(${table})`)[0]?.values ?? [];
  return rows.map((row) => String(row[1])).sort();
}

// Every non-key field holds a non-default value, so a column the merge skips shows up as a difference.
async function seededDatabase(): Promise<Database> {
  const db = await createTestDatabaseForEntries();
  const entry = seedEntry(db, {
    content: 'synced',
    assignedDay: '2022-03-04',
    orderPosition: 7,
    isDeleted: true,
  });
  const tag = seedTag(db, { name: 'work', isDeleted: true });
  seedEntryTag(db, { entryId: entry.id, tagId: tag.id, isDeleted: true });
  return db;
}

describe('synced columns match the schema', () => {
  it.each(SYNCED_TABLES)('serializes every column of %s and nothing else', async (table) => {
    const db = await seededDatabase();
    const rows = serializeDatabase(db)[table];

    expect(rows).toHaveLength(1);
    expect(Object.keys(rows[0] ?? {}).sort()).toEqual(tableColumns(db, table));
  });

  it('merges every serialized column into an empty database', async () => {
    const payload = serializeDatabase(await seededDatabase());
    const target = await createTestDatabaseForEntries();

    applySyncPayload(target, payload);

    expect(serializeDatabase(target)).toEqual(payload);
  });
});
