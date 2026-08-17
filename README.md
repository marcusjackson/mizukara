# Mizukara

> **自ら** (mizukara): "oneself", "by oneself", "under one's own steam"

A personal journaling tool for capturing partial memories and occasional reflections. Offline-first, fully self-owned, optimized for low-pressure capture.

---

## What This Is

This is a tool I built for myself to journal in a way that works better than existing apps. Instead of using a service with servers and accounts, I wanted something that lived completely on my device, where I owned the data, and where capturing a thought was frictionless.

The core insight: **Journaling should make capturing easy, not performative.**

Most journaling apps subtly encourage:

- Daily, structured entries
- Long, polished writing
- Completeness and narrative
- Capturing everything

This app rejects that model entirely. Instead, it optimizes for:

- **Many small captures** — A thought, a reminder, a phrase, a question
- **Low friction** — Fast input, minimal decision-making
- **Partial recall** — Missing things is expected and normal
- **Self-owned data** — All in a local SQLite database, exportable anytime
- **Privacy by design** — Offline operation enables deeper honesty

### Why Build Your Own Journaling Tool?

Most journaling apps store data on third-party servers. This creates obvious problems — you don't own the data, you're dependent on the service continuing to exist, and there's no guarantee of portability. Beyond that, many tools subtly create pressure: the expectation of daily entries, polished writing, completeness.

This tool exists because:

1. **Data ownership** — Your journal lives locally in an inspectable SQLite database. You own it completely.
2. **Low pressure** — Partial capture is enough. Missing things is expected. Gaps are normal.
3. **Privacy enables honesty** — Knowing nothing leaves your device creates psychological safety for deeper reflection.

It's built to be useful decades from now, without servers, accounts, or external dependencies.

---

## What It Can Do

### Today

**Journaling:**

- Create journal items quickly (text entry with optional title)
- Assign items to specific days (capture now, assign when/where it belongs)
- View items by day in a dense list
- Edit items anytime
- Optionally reorder items within a day
- Search across all items

**Organization:**

- Manually title items for clarity
- Tag items for loose grouping
- Full-text search across content and titles
- Export/import entire database as SQLite file

**Offline & Data:**

- Fully offline, installable as PWA
- SQLite database persists in browser IndexedDB
- Works indefinitely without internet or servers
- Export/import database for backup or portability

### Future

- Optional auto-generated titles and tags via local LLM
- Suggested summaries and themes
- Quick retrospective views (weekly, monthly)
- Offline device sync via WebRTC (no cloud)
- Optional memory/context tracking (people, projects, concerns)

---

## How It Works

### Core Concepts

**Item** — The core unit. A thought, a reminder, an event, a feeling — anything you want to record. Unified concept: length and depth are emergent properties, not declared types. Each item has:

- Content (what you captured)
- Optional title (for clarity)
- Optional tags (loose grouping)
- Creation timestamp (when you wrote it)
- Assigned day (when it's about)

**Day view** — Dense list of items for a specific day. Shows all captures regardless of when they were written. Optimized for scanning and selective reading.

**Timeline** — Browse days forward/backward. See the shape of your journaling over time. Not an exhaustive archive — just what was captured.

### Chronology vs. Recall

A central design principle: **when you wrote something ≠ when something happened.**

Thoughts are often recorded out of order. Items may be written hours or days after the events they describe. Recall is associative, not chronological.

Therefore:

- **Creation timestamp** — When you entered the item (mechanical, immutable)
- **Assigned day** — When the content is about (conceptual, editable)

This acknowledges how memory actually works and supports reflective reconstruction of days without forcing chronological order.

### This Is a Personal Tool

This project is **not a service or a multi-user platform**. It's built for you to use alone:

- No "users" — just you
- No authentication or accounts
- No servers or syncing
- No performance optimization for scale
- No metrics or analytics

Design decisions always prioritize: "Does this serve the individual better?" not "Does this scale?"

---

## Technical Details

Built with Vue 3, TypeScript, and SQL.js (SQLite in WebAssembly). Everything runs in the browser. No server needed.

**Stack:**

- Vue 3 Composition API
- TypeScript (strict mode)
- SQLite via sql.js (WebAssembly, persistent in IndexedDB)
- Reka UI (accessible, headless components)
- vee-validate + zod (form validation)
- Vite + PWA Plugin
- Vitest + Playwright (testing)

**Data:**

- Portable SQLite file
- Export/import anytime
- Runs completely offline

---

## 📁 Project Structure

```
src/
├── api/                        # API layer (repositories, queries, mutations)
├── modules/                    # Feature modules (entry-list, entry-detail, etc.)
├── pages/                      # Route entry points (thin wrappers)
├── base/                       # Generic, reusable components and composables
├── shared/                     # App-specific shared code
├── db/                         # Database initialization, migrations, lifecycle
├── router/                     # Vue Router configuration
└── styles/                     # Global styles and design tokens

e2e/                            # End-to-end tests (Playwright)
test/                           # Unit test setup and helpers
docs/                           # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 24+
- pnpm 11+

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd mizukara

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will open in your browser. All data is saved locally in IndexedDB.

### Building for Production

```bash
pnpm build     # Create optimized production build
pnpm preview   # Preview the production build locally
```

The built app is a fully-functional PWA. Install it on your device via the browser menu.

---

## 📚 Development

### Available Commands

```bash
pnpm dev              # Start dev server (hot reload)
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm test             # Run unit tests
pnpm test:e2e         # Run E2E tests
pnpm lint             # Lint code (ESLint + Prettier + Stylelint)
pnpm format           # Format code with Prettier
pnpm type-check       # TypeScript type checking
```

### Working with Makefile

For efficiency during development, use the Makefile for incremental checks:

```bash
make lint-changed       # Lint only changed files
make test-changed       # Test only affected areas
make lint FILES="src/foo.ts"  # Lint specific files
make ci-full            # Full validation (lint + unit + E2E)
```

### Development Workflow

1. Create a feature branch
2. Make changes and test locally (`pnpm dev`)
3. Run lint and tests (`make lint-changed`, `make test-changed`)
4. Commit with conventional commit format
5. Push and create a pull request

---

## 📖 Documentation

- **[Concept & Design Rationale](docs/concept-design-rationale.md)** — Philosophy, constraints, and design thinking

---

## 🔐 Privacy & Data

- **All data stays local** — Nothing is sent to external servers
- **Full ownership** — Export your database anytime as a standard SQLite file
- **Offline-first** — Works without internet connection
- **Standard format** — SQLite is a widely-supported, future-proof format

Your journal is yours.

---

## License

LGPL-2.1

---

_A tool for self-owned reflection, built for long-term use._
