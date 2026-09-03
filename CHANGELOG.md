# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [0.3.0] - 2026-09-04

### Added

- Device sync: pair two devices via QR code or a short code and sync entries between them over a direct peer-to-peer connection, with last-write-wins merging and tag deduplication.

### Fixed

- Connection setup now waits for real ICE candidates instead of a blind fixed delay, with a fallback timeout so pairing can't hang indefinitely.
- The data channel is no longer handed off before it's actually open, and closing now waits for the channel's own close handshake.
- Pairing over camera/QR now requires HTTPS, which mobile browsers require for camera access.

## [0.2.1] - 2026-08-18

### Fixed

- In-app displayed version was still showing `0.1.0` after the `v0.2.0` release.
- Service worker updates now prompt the user to reload instead of silently waiting until every open tab/window is fully closed.

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
