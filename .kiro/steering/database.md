# Database Architecture & Sync Strategy

## Core Database Design

**Technology**: SQLite via sql.js (WebAssembly in browser)  
**Persistence**: IndexedDB for long-term storage  
**Pattern**: Repository layer in `/src/api/` for all database access

### Key Principles

- **UUIDs as primary keys** — TEXT UUIDs instead of INTEGER for sync compatibility
- **Timestamps everywhere** — `created_at` and `updated_at` on all tables
- **Soft deletes** — `is_deleted` flag instead of hard deletes (required for sync)
- **Sync metadata** — Track device origin and modification history

### Why These Constraints?

Traditional auto-increment INTEGER IDs create conflicts when two devices create records independently. UUIDs eliminate this collision risk.

Hard deletes cannot be synced (can't transmit what doesn't exist). Soft deletes allow propagating deletion events across devices.

## Device Sync Architecture

**Goal**: Sync database between two devices on the same local network without a server.

**Technology**: WebRTC for P2P data transfer, manual signaling (QR code + short code)

### Sync Strategy: Delta Sync

Instead of exporting/importing entire database:

1. **Compare timestamps** — Each device queries `updated_at > last_sync_time`
2. **Transfer delta** — Only modified rows sent via WebRTC data channel
3. **Merge locally** — Apply changes to local database
4. **Resolve conflicts** — Last Write Wins (LWW) using `updated_at` timestamp

### Conflict Resolution

**Last Write Wins (LWW)** — Simple, deterministic, sufficient for personal use:

- Compare `updated_at` timestamps
- Newer timestamp wins
- Overwrite older version

**Why not CRDT or manual merge?** Personal tool with single owner. Conflicts are rare (same person unlikely to edit same record on two devices simultaneously). LWW is simple, predictable, and avoids UI complexity.

### Schema Requirements for Sync

All tables must include:

```sql
CREATE TABLE example (
  id TEXT PRIMARY KEY,              -- UUID v4
  created_at INTEGER NOT NULL,       -- Unix timestamp (ms)
  updated_at INTEGER NOT NULL,       -- Unix timestamp (ms)
  is_deleted INTEGER DEFAULT 0,      -- Soft delete flag
  device_id TEXT,                    -- Origin device (optional)
  -- ... domain fields
);
```

**Why INTEGER timestamps?** SQLite doesn't have native datetime type. Unix timestamps (milliseconds) are sortable, compact, and easy to work with.

### Sync Flow

**Setup Phase** (one-time per session):

1. PC displays QR code with local IP + WebRTC offer
2. Mobile scans QR code
3. Mobile generates WebRTC answer as compressed short code (10-15 chars)
4. User types short code into PC
5. WebRTC peer connection established

**Sync Phase** (ongoing):

1. Both devices query: `SELECT * FROM [table] WHERE updated_at > ?`
2. Transfer delta as JSON via RTCDataChannel
3. Apply changes: INSERT/UPDATE/DELETE based on `is_deleted` flag
4. Update `last_sync_time` marker

### Implementation Notes

- **No persistent connection** — Sync is manual, initiated by user
- **Session-based** — Connection lasts as long as both apps are open
- **Local network only** — No STUN/TURN servers needed (NAT not an issue)
- **Compression** — WebRTC SDP compressed using sdp-compact + Base32 encoding

## Migration Strategy

Database migrations in `/src/db/migrations/`:

- **Version-based** — Sequential migration files
- **Idempotent** — Safe to re-run
- **Sync-aware** — Future migrations must preserve UUID PKs, timestamps, soft deletes

## Export/Import (Fallback)

Manual export/import remains available as fallback:

- Export entire `.sqlite` file
- Transfer via cloud storage or file sharing
- Import on second device

This is slower but works across any distance, not just local network.

## Future Considerations

- **Encryption** — Future feature could encrypt database at rest (sql.js supports)
- **Selective sync** — Future feature could sync only certain tables or date ranges
- **Multi-device tracking** — Track which devices have which data (sync log table)

---

_created: 2026-02-01_
