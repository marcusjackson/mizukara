/**
 * Reorder against a real in-memory database
 *
 * The mocked suite in use-entry-reorder.test.ts checks which updates are
 * issued. These cases check the order a reader sees afterwards, including a day
 * in which a third entry ties with the pair being swapped.
 */

import { ref, shallowRef } from 'vue';

import { TEST_DATES } from '@test/constants/dates';
import { createTestDatabaseForEntries, seedEntry } from '@test/helpers/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { findByDay } from '@/api/entries/entry-queries';

import { useDatabase } from '@/shared/composables/use-database';

import { useEntryReorder } from './use-entry-reorder';

import type { Database } from 'sql.js';

vi.mock('@/shared/composables/use-database', () => ({ useDatabase: vi.fn() }));
vi.mock('@/db/indexeddb', () => ({ schedulePersist: vi.fn() }));

describe('useEntryReorder against a real database', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createTestDatabaseForEntries();
    vi.mocked(useDatabase).mockReturnValue({
      database: shallowRef(db),
      isInitialized: ref(true),
      isInitializing: ref(false),
      initError: ref(null),
      initialize: vi.fn(),
      persist: vi.fn(),
      exec: vi.fn(),
      run: vi.fn(),
      replaceDatabase: vi.fn(),
    });
  });

  it('moves an entry exactly one place when a third entry ties with its neighbour', () => {
    // A and B tie at 1 (B created later); C sits at 2 but was created first.
    seedEntry(db, { id: 'A', assignedDay: TEST_DATES.DEFAULT, orderPosition: 1, createdAt: 2 });
    seedEntry(db, { id: 'B', assignedDay: TEST_DATES.DEFAULT, orderPosition: 1, createdAt: 3 });
    seedEntry(db, { id: 'C', assignedDay: TEST_DATES.DEFAULT, orderPosition: 2, createdAt: 1 });
    const { moveEntryUp } = useEntryReorder({ onRefetch: vi.fn() });

    const result = moveEntryUp('C', findByDay(db, TEST_DATES.DEFAULT));

    expect(result.success).toBe(true);
    expect(findByDay(db, TEST_DATES.DEFAULT).map((entry) => entry.id)).toEqual(['A', 'C', 'B']);
  });

  it('swaps two entries with distinct positions without touching the rest', () => {
    seedEntry(db, { id: 'A', assignedDay: TEST_DATES.DEFAULT, orderPosition: 0 });
    seedEntry(db, { id: 'B', assignedDay: TEST_DATES.DEFAULT, orderPosition: 1 });
    seedEntry(db, { id: 'C', assignedDay: TEST_DATES.DEFAULT, orderPosition: 5 });
    const { moveEntryDown } = useEntryReorder({ onRefetch: vi.fn() });

    moveEntryDown('A', findByDay(db, TEST_DATES.DEFAULT));

    const positions = findByDay(db, TEST_DATES.DEFAULT).map((e) => [e.id, e.orderPosition]);
    expect(positions).toEqual([
      ['B', 0],
      ['A', 1],
      ['C', 5],
    ]);
  });
});
