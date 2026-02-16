# Product Overview

**Record PWA** is a personal, offline-first Progressive Web App for capturing partial memories and occasional reflections. It is designed as a **tool for individual use**, not a service with users. Data ownership, privacy, and long-term usability are non-negotiable constraints.

## Core Philosophy

This app rejects four common patterns in journaling software:

1. **Data ownership on third-party servers** → All data lives locally in SQLite
2. **High friction to capture thoughts** → Optimized for many small, quick captures
3. **Performance over honesty** → Privacy enables deeper reflection
4. **Pressure to be complete** → Partial recall is enough; missing things is expected

The app should be useful decades from now, without servers, accounts, or external dependencies.

## Core Capabilities

- **Low-friction capture** — Default to quick, small items (a thought, a phrase, a note)
- **Unified items** — No distinction between "entries" and "quick notes"; length is emergent, not a type
- **Memory reconstruction** — Support assembling a day after the fact, without pressure for completeness
- **Safe reading mode** — Viewing never mutates data; editing is explicit and intentional
- **Offline-first** — Full functionality without internet, SQLite persistence in browser
- **Device sync** (future) — Local network sync via WebRTC, no cloud required

## Personal Tool, Not a Service

Critical mindset: **This is not a multi-user application.**

- No concept of "users" — only the individual using it
- No authentication, no accounts, no permissions
- No performance optimization for scale
- No metrics, analytics, or tracking
- Design decisions prioritize personal ownership over features

When considering architecture or features, think "personal tool that lasts decades," not "service with users."

## Value Proposition

**A safe place to put some of what you remember, so you can understand your days better over time.**

Most journaling apps subtly encourage:

- Daily, structured entries
- Long, polished writing
- Completeness and narrative
- Capturing everything

This app explicitly rejects that model. Instead:

- Fragmented thoughts are valid
- Incomplete ideas are expected
- Partial recall is enough
- Missing things is expected and normal
- Capturing matters more than polishing
- Many small captures are the norm, not the exception

The app removes friction to capture, and optionally adds structure later via LLM assistance (auto-titles, tags, summaries) — but always editable, never forced.

### Low Pressure by Design

A central goal is to **avoid creating obligation** — whether for reflective journaling, event recording, or memory reconstruction.

The app should never encourage completeness, exhaustiveness, or anxiety about missed entries. Gaps are normal. Value comes from what is captured, not what is absent.

## Key Design Constraints

### Self-Ownership & Trust

- All data in local, inspectable SQLite database
- Import/export always possible
- No background syncing to servers
- User owns both data and meaning

### Privacy Enables Honesty

- Offline operation is psychological, not just technical
- Knowing nothing leaves the device enables deeper reflection
- Future LLM features will use local models only

### Items, Not Entries

While "journaling" is used as shorthand, the app intentionally avoids narrow definitions.

Items may represent:

- Things that happened
- Things remembered later
- Thoughts, questions, feelings
- Vague notes meant to support future recall

Reflection is optional and often downstream. The core object is simply an **item** — length, depth, and intent are emergent properties, not types.

### Chronology vs. Recall

- Creation timestamp (when entered) vs. assigned time context (when it's about)
- Intentional reordering allowed, but never accidental
- Support reflective reconstruction of time, not constant structural manipulation

### Assembling a Day

A key use case is **assembling a day after the fact** — recalling events non-chronologically, entering items hours or days later, filling in only what is remembered.

Importantly:

- No pressure to reconstruct an entire day
- No expectation of completeness
- Assembly is optional and partial

This avoids the trap of obsessive record-keeping while still supporting meaningful recall.

## Development Philosophy

**Always usable** — At every stage of development, the app should be functional. Initial version may only support writing and viewing, but that's already valuable. Features are added incrementally without breaking usability.

---

_created: 2026-02-01_
_updated: 2026-02-01_
