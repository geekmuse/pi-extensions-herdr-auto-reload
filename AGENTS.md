# AGENTS.md

Guidance for AI agents (and humans) contributing to this repository.

## Project

`pi-herdr-auto-reload` is a [Pi](https://www.npmjs.com/package/@earendil-works/pi-coding-agent) extension package. It adds `/reload-herdr-sessions`, which enumerates live Pi sessions on the current Herdr server, prompts each to `/reload`, then reloads the invoking session. It also preserves unsubmitted TUI prompt text across that reload using durable Pi session entries.

## Commands

- `npm run build` — compile `src/` TypeScript to `dist/` (committed to the repo)
- `npm test` — build, then run the `node:test` suite
- `npm pack --dry-run` — inspect the published artifact

## Architecture

- `src/index.ts` — extension entry point: registers the command and the `session_start` restore handler. The command handler must end with `await ctx.reload()`; that call is terminal and rebinds extension runtime state.
- `src/herdr.ts` — parses `herdr agent list` JSON into Pi-agent records.
- `src/prompt-buffer.ts` — scans session entries for the newest unresolved prompt-buffer backup. Recovery entries are append-only and never overwritten.
- `test/herdr.test.mjs` — `node:test` suite with fake `pi`/`ctx` objects; no live Herdr or Pi required.

## Conventions

- Commit `dist/` together with the `src/` change that produced it — git installs rely on prebuilt `dist/`.
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`).
- Bump versions with `npm version <type> --no-git-tag-version`, then run `npm install --package-lock-only` to sync the lockfile.
- Keep changes to the public extension surface reflected in `README.md` and `CHANGELOG.md`.

## Extension API notes

- The command is Herdr-gated: it requires `HERDR_ENV=1` and `HERDR_PANE_ID`; otherwise notify and return without reloading.
- `pi.appendEntry` persists to the session JSONL before the visible buffer is cleared; clear the editor only immediately before `ctx.reload()` so a failed pre-reload step never loses text.
- RPC sessions (`ctx.mode !== "tui"`) cannot read or restore the editor buffer.
- `agent_status` from `herdr agent list` is a snapshot; do not treat it as a lock.
