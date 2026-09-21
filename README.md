# pi-herdr-auto-reload

A [Pi](https://www.npmjs.com/package/@earendil-works/pi-coding-agent) extension package that reloads every live Pi session managed by the current Herdr server — so installing or updating an extension in one session can be propagated everywhere with a single command.

Run `/reload-herdr-sessions` from a Herdr-managed Pi pane to:

1. discover every live `pi` agent on the current Herdr server, across projects and workspaces;
2. inject `/reload` into every other Pi session; and
3. reload the invoking session through Pi's supported `ctx.reload()` API.

Blocked or unavailable sessions are reported but do not prevent the invoking session from reloading.

## Requirements

- [Node.js](https://nodejs.org) 18 or newer
- [Pi](https://www.npmjs.com/package/@earendil-works/pi-coding-agent) (`@earendil-works/pi-coding-agent`)
- A Herdr server managing your Pi sessions. The command only works inside a Herdr-managed pane — it relies on the `HERDR_ENV` and `HERDR_PANE_ID` environment variables Herdr sets.

## Prompt-buffer preservation

Before the invoking session reloads, the command saves any unsubmitted TUI prompt text in a custom entry in Pi's on-disk session JSONL, then clears the editor. The reloaded extension restores that text during `session_start` and records the restoration. If restoration cannot proceed (for example, the editor is unexpectedly nonempty), the pending recovery entry remains durable for a later reload or restart; it is never overwritten.

This is only possible in interactive TUI sessions: Pi's RPC mode cannot read the editor buffer, so RPC sessions reload without buffer preservation. Saved prompt text lives in the session JSONL until restored — treat session files with the same care as conversation transcripts.

## Install

From GitHub:

```bash
pi install https://github.com/geekmuse/pi-extensions-herdr-auto-reload
```

For local development:

```bash
pi install /absolute/path/to/pi-extensions-herdr-auto-reload
```

Then run `/reload-herdr-sessions` from any Herdr-managed Pi session. Installing or updating the package in one session still requires that initial session to run `/reload` (or restart) before the command becomes available.

## Limitations

- `agent_status` from `herdr agent list` is a snapshot; a session may change state between listing and delivery.
- Sessions whose panes reject input (for example, blocked agents) are reported as failures but never block the local reload.

## Development

```bash
npm install
npm test
```

`dist/` is compiled and committed on purpose so git installs work without a build step — always rebuild and commit `dist/` together with `src/` changes. See [AGENTS.md](AGENTS.md) for repository conventions.

## License

[MIT](LICENSE)
