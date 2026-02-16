# Device Sync for Offline-First PWA

Technical reference for implementing local network database synchronization in an offline-first Progressive Web App using sql.js and WebRTC.

## Problem Statement

**Challenge**: Sync SQLite database between two devices (typically mobile ↔ PC) without a central server, while maintaining offline-first principles.

**Current solution**: Manual export → cloud storage → manual import (slow, high friction)

**Goal**: Quick, local network sync initiated by user on demand

## Architecture Overview

### Core Technologies

- **WebRTC** — Peer-to-peer data transfer without server
- **Manual signaling** — QR code + short code for connection setup
- **Delta sync** — Transfer only changed data, not entire database
- **Local network only** — No NAT traversal needed (same Wi-Fi)

### Why This Approach?

**WebRTC** provides direct browser-to-browser communication. On local network, no STUN/TURN servers required.

**Manual signaling** eliminates need for signaling server. QR code + short code provides simple UX without complex device discovery.

**Delta sync** reduces transfer size from full database (could be MB) to only recent changes (typically KB).

## Implementation Components

### 1. Signaling (Connection Setup)

**Challenge**: WebRTC requires initial signaling to exchange connection metadata (SDP offers/answers).

**Solution**: Asymmetric manual exchange optimized for mobile ↔ PC

#### Flow

1. **PC generates WebRTC offer** containing:
   - Local IP address
   - SDP (Session Description Protocol) data
   - ICE candidates

2. **PC displays QR code** — Mobile has camera, PC typically doesn't

3. **Mobile scans QR code** — Receives offer data

4. **Mobile generates WebRTC answer** — Creates response SDP

5. **Mobile displays compressed short code** (10-15 characters)
   - SDP compressed using sdp-compact library
   - Encoded as Base32 (case-insensitive, avoids ambiguous chars)

6. **User types code into PC** — Easier than PC scanning mobile screen

7. **Connection established** — WebRTC data channel opens

#### Why This Flow?

- **Scanning direction**: Mobile → PC (mobile has camera)
- **Typing direction**: Human → PC (easier than mobile keyboard)
- **Compression**: 2.5KB SDP → 10-15 char code (sdp-compact + Base32)

### 2. Database Schema for Sync

**Requirements**: Schema must support conflict-free merging across devices

#### Essential Columns

```sql
CREATE TABLE journal_items (
  id TEXT PRIMARY KEY,              -- UUID v4 (not auto-increment)
  created_at INTEGER NOT NULL,       -- Unix timestamp (milliseconds)
  updated_at INTEGER NOT NULL,       -- Unix timestamp (milliseconds)
  is_deleted INTEGER DEFAULT 0,      -- Soft delete flag

  -- Domain fields
  content TEXT NOT NULL,
  title TEXT,
  -- ...
);
```

#### Why These Constraints?

**UUID primary keys** — Prevents ID collision when two devices create records independently

- Auto-increment IDs would conflict (both devices create ID=1, ID=2, etc.)
- UUIDs are globally unique
- TEXT column type in SQLite

**Timestamps** — Enable delta sync and conflict resolution

- `created_at`: Immutable, tracks origin time
- `updated_at`: Modified on every change, used for sync queries
- Unix timestamp in milliseconds for precision

**Soft deletes** — Hard deletes cannot be synced

- Can't transmit what doesn't exist
- `is_deleted = 1` allows propagating deletion events
- Periodic cleanup can purge old soft-deleted records if needed

### 3. Delta Sync Strategy

**Concept**: Only transfer rows modified since last sync

#### Sync Algorithm

```typescript
// On each device:
const lastSyncTime = await getLastSyncTime()

// Query delta
const changes = db.exec(`
  SELECT * FROM journal_items
  WHERE updated_at > ?
  ORDER BY updated_at ASC
`, [lastSyncTime])

// Send delta to peer via WebRTC
sendViaPeerConnection(changes)

// Receive delta from peer
const peerChanges = await receiveFromPeer()

// Apply changes
for (const row of peerChanges) {
  if (row.is_deleted) {
    db.exec('UPDATE journal_items SET is_deleted = 1 WHERE id = ?', [row.id])
  } else {
    // Upsert: INSERT OR REPLACE
    db.exec(`
      INSERT OR REPLACE INTO journal_items
      (id, created_at, updated_at, content, title, ...)
      VALUES (?, ?, ?, ?, ?, ...)
    `, [row.id, row.created_at, row.updated_at, row.content, row.title, ...])
  }
}

// Update sync marker
await setLastSyncTime(Date.now())
```

#### Why This Works

- **Bidirectional**: Both devices send and receive deltas
- **Incremental**: Only new/modified data transferred
- **Idempotent**: Safe to re-run if connection drops
- **Efficient**: Typical sync transfers KB instead of MB

### 4. Conflict Resolution

**Problem**: What if both devices edited the same record while offline?

#### Strategy: Last Write Wins (LWW)

Compare `updated_at` timestamps:

```typescript
function mergeRow(localRow, remoteRow) {
  if (remoteRow.updated_at > localRow.updated_at) {
    // Remote is newer, overwrite local
    return remoteRow
  } else {
    // Local is newer or equal, keep local (no action needed)
    return localRow
  }
}
```

#### Why LWW for Personal Tool?

- **Simple**: No complex merging logic
- **Deterministic**: Same result on both devices
- **Sufficient**: Single owner unlikely to edit same record on two devices simultaneously
- **No UI burden**: Avoids manual conflict resolution screens

**Alternative strategies** (not recommended for this use case):

- **Manual merge**: Show UI to choose version → Too complex for personal tool
- **CRDT**: Merge both changes → Overkill, adds significant complexity

### 5. WebRTC Data Transfer

#### RTCDataChannel Usage

```typescript
// Create data channel
const peerConnection = new RTCPeerConnection()
const dataChannel = peerConnection.createDataChannel('sync')

// Send delta
dataChannel.send(
  JSON.stringify({
    type: 'delta',
    table: 'journal_items',
    rows: deltaRows
  })
)

// Receive delta
dataChannel.onmessage = (event) => {
  const data = JSON.parse(event.data)
  if (data.type === 'delta') {
    applyDelta(data.table, data.rows)
  }
}
```

#### Transfer Optimization

- **Chunking**: Split large deltas into smaller chunks to avoid DataChannel message size limits
- **Compression**: Optional gzip compression for larger payloads
- **Progress**: Send progress events for long sync operations

### 6. Connection Persistence

**Limitation**: WebRTC connections don't persist across app/tab closes

#### Implications

- **Manual sync**: User initiates sync when needed
- **Session-based**: Connection lasts while both apps open
- **Re-signaling**: Each sync session requires new QR code exchange

#### Optimization: Cached IPs

Store last known local IP in IndexedDB:

```typescript
// On successful connection, cache peer IP
localStorage.setItem('lastPeerIP', peerLocalIP)

// On next sync attempt, try cached IP first
const cachedIP = localStorage.getItem('lastPeerIP')
if (cachedIP) {
  // Attempt connection without QR code
  // Fall back to QR code if fails
}
```

**Limitation**: Only works if both devices still on same network and IPs haven't changed

## Implementation Roadmap

### Phase 1: Schema Updates (MVP)

- Add UUID primary keys to all tables
- Add `created_at`, `updated_at` timestamps
- Add `is_deleted` soft delete flags
- Create migration from existing schema

### Phase 2: Delta Query Infrastructure

- Implement timestamp-based delta queries
- Create `last_sync_time` tracking table
- Build upsert logic for applying deltas

### Phase 3: WebRTC Signaling

- Implement PC offer generation
- Build QR code display component
- Create mobile QR scanner
- Implement SDP compression + short code generation
- Build short code input + validation on PC

### Phase 4: Data Transfer

- Implement RTCDataChannel setup
- Build delta serialization/deserialization
- Add chunking for large transfers
- Create progress UI

### Phase 5: Conflict Resolution

- Implement LWW merge logic
- Add conflict detection logging
- Build reconciliation UI (optional, for review)

### Phase 6: Error Handling & Polish

- Connection timeout handling
- Network error recovery
- Retry logic
- User feedback (progress, success, errors)

## Security Considerations

### Local Network Only

- No internet exposure
- Only devices on same Wi-Fi can connect
- No STUN/TURN means no external servers

### Future: Encryption

For paranoid security:

- Encrypt WebRTC data channel payload
- Use shared passphrase or key exchange
- Not required for local network, but possible

### Database Encryption at Rest

sql.js supports SQLCipher extension for encrypted databases:

```typescript
const db = new SQL.Database({
  encryption: {
    key: userPassphrase
  }
})
```

Consider for future feature if storing sensitive journal content.

## Testing Strategy

### Unit Tests

- Delta query generation
- Conflict resolution logic
- Short code compression/decompression
- Timestamp handling

### Integration Tests

- Full sync flow between two database instances
- Conflict scenarios (both devices modify same record)
- Large delta transfers
- Connection interruption recovery

### Manual E2E Testing

- Real devices on local network
- QR code scanning flow
- Short code typing UX
- Network switching (Wi-Fi reconnect)

## References

### Libraries

- **sdp-compact** — SDP compression
- **sql.js** — SQLite in WebAssembly
- **uuid** — UUID generation

### Standards

- **WebRTC API** — MDN documentation
- **RTCDataChannel** — Message-based P2P transfer
- **SDP (Session Description Protocol)** — WebRTC signaling format

### Related Patterns

- **Offline-first architecture** — Local database as source of truth
- **Last Write Wins** — Simple conflict resolution for CRDTs
- **Delta synchronization** — Transfer only changes, not full state

---

_created: 2026-02-01_  
_based on: Gemini chat discussion, WebRTC patterns, offline-first best practices_
