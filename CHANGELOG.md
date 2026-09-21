# Changelog

All notable changes to this project are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows [SemVer](https://semver.org).

## [1.0.0] - 2026-09-21

### Added
- Public-release readiness: MIT `LICENSE`, repository metadata, Node engine requirement, CI workflow, `AGENTS.md`, and this changelog.
- Portable test discovery (`node --test`) and expanded `.gitignore`.

## [0.2.0] - 2026-09-20

### Added
- Prompt-buffer preservation across reloads: unsubmitted TUI text is saved as a Pi session entry, restored after reload, and left durable if restoration fails or the editor is unexpectedly nonempty.

## [0.1.0] - 2026-09-20

### Added
- `/reload-herdr-sessions`: broadcast `/reload` to every live Herdr-managed Pi session, then reload the invoking session.
