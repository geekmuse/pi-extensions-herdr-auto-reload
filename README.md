# pi-herdr-auto-reload

A Pi package that adds `/reload-herdr-sessions`.

Run the command from a Herdr-managed Pi pane to:

1. discover every live `pi` agent on the current Herdr server, across projects and workspaces;
2. inject `/reload` into every other Pi session; and
3. reload the invoking session through Pi's supported `ctx.reload()` API.

Blocked or unavailable sessions are reported but do not prevent the invoking session from reloading. The command is intentionally unavailable outside a Herdr-managed pane.

## Install

For local development:

```bash
pi install /absolute/path/to/pi-extensions-herdr-auto-reload
```

Then run `/reload-herdr-sessions` from any Herdr-managed Pi session. Installing or updating the package in one session still requires that initial session to run `/reload` (or restart) before the command becomes available.

## Development

```bash
npm install
npm test
```
