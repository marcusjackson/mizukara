/**
 * Tests for runMigrations version handling
 */

import initSqlJs from 'sql.js';
import { describe, expect, it } from 'vitest';

import migration001 from './001-create-entries.sql?raw';
import migration002 from './002-create-tags.sql?raw';
import migration003 from './003-tags-name-unique-index.sql?raw';
import { LATEST_SCHEMA_VERSION, runMigrations } from './index';

function readVersion(db: { exec: (sql: string) => { values: unknown[][] }[] }) {
  return db.exec('PRAGMA user_version')[0]?.values[0]?.[0];
}

describe('runMigrations', () => {
  it('brings a fresh database to the latest version', async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    runMigrations(db);

    expect(readVersion(db)).toBe(LATEST_SCHEMA_VERSION);
  });

  it('refuses a database saved by a newer version and leaves it untouched', async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    db.run(`PRAGMA user_version = ${String(LATEST_SCHEMA_VERSION + 1)}`);

    expect(() => {
      runMigrations(db);
    }).toThrow(/newer version of Mizukara/);
    expect(readVersion(db)).toBe(LATEST_SCHEMA_VERSION + 1);
  });

  it('accepts a database already at the latest version', async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    runMigrations(db);

    expect(() => {
      runMigrations(db);
    }).not.toThrow();
  });

  it('upgrades a version-3 database to the latest without duplicating FTS rows', async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    db.exec(migration001);
    db.exec(migration002);
    db.exec(migration003);
    db.run(
      `INSERT INTO entries (id, content, created_at, updated_at, assigned_day, order_position, is_deleted)
       VALUES ('e1', 'hello', 1, 1, '2022-01-01', 0, 0)`
    );
    expect(readVersion(db)).toBe(3);

    runMigrations(db);

    expect(readVersion(db)).toBe(LATEST_SCHEMA_VERSION);
    const fts = db.exec('SELECT COUNT(*) FROM entries_fts');
    expect(fts[0]?.values[0]?.[0]).toBe(1);
  });
});

describe('migration files', () => {
  const files = Object.entries(
    import.meta.glob<string>('./*.sql', { query: '?raw', import: 'default', eager: true })
  ).sort(([a], [b]) => a.localeCompare(b));

  it('are all registered with the runner', () => {
    expect(files).toHaveLength(LATEST_SCHEMA_VERSION);
  });

  it.each(files.map(([name, sql], index) => ({ name, sql, version: index + 1 })))(
    '$name ends by setting user_version to its position, $version',
    ({ sql, version }) => {
      const pragmas = [...sql.matchAll(/PRAGMA\s+user_version\s*=\s*(\d+)/gi)];

      expect(pragmas.at(-1)?.[1]).toBe(String(version));
    }
  );
});
