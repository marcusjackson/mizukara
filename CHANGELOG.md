# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-08-18

### Added

- Tags: create tags, browse entries by tag, and attach/remove tags from the entry editor and day view.
- Auto-expanding textarea in the entry editor.

### Fixed

- IndexedDB connection is now cached so entries reliably persist on `beforeunload`.
- Tag chips now stay visible and refresh correctly after saving an entry.
- The sql.js wasm binary is now served correctly for the browser build.

## [0.1.0] - 2026-02-17

### Added

- Initial release: entry day view, entries, app settings.
