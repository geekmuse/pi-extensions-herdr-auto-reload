import assert from "node:assert/strict";
import test from "node:test";
import herdrAutoReload from "../dist/index.js";
import { parsePiAgents } from "../dist/herdr.js";
import { findPendingPromptBuffer, PROMPT_BUFFER_ENTRY } from "../dist/prompt-buffer.js";

const registeredCommands = new Map();
const fakePi = {
  on() {},
  registerCommand(name, definition) {
    registeredCommands.set(name, definition);
  },
};

test("registers the public reload command", () => {
  herdrAutoReload(fakePi);
  assert.ok(registeredCommands.has("reload-herdr-sessions"));
});

test("parsePiAgents retains only complete Pi-agent records", () => {
  const output = JSON.stringify({
    result: {
      agents: [
        { agent: "pi", pane_id: "w1:p1", agent_status: "idle" },
        { agent: "codex", pane_id: "w1:p2", agent_status: "working" },
        { agent: "pi", pane_id: 42, agent_status: "idle" },
      ],
    },
  });

  assert.deepEqual(parsePiAgents(output), [{ agent: "pi", pane_id: "w1:p1", agent_status: "idle" }]);
});

test("parsePiAgents rejects malformed Herdr responses", () => {
  assert.throws(() => parsePiAgents("not json"), /invalid JSON/);
  assert.throws(() => parsePiAgents(JSON.stringify({ result: {} })), /invalid agent list/);
});

test("findPendingPromptBuffer ignores acknowledged and malformed recovery entries", () => {
  const pending = { type: "custom", customType: PROMPT_BUFFER_ENTRY, data: { state: "pending", text: "draft" } };
  const restored = { type: "custom", customType: PROMPT_BUFFER_ENTRY, data: { state: "restored" } };
  assert.deepEqual(findPendingPromptBuffer([pending]), { state: "pending", text: "draft" });
  assert.equal(findPendingPromptBuffer([pending, restored]), undefined);
  assert.equal(findPendingPromptBuffer([{ type: "custom", customType: PROMPT_BUFFER_ENTRY, data: { state: "pending" } }]), undefined);
});

test("does not clear the prompt when Herdr discovery fails", async () => {
  const commands = new Map();
  const pi = {
    on() {},
    registerCommand(name, definition) { commands.set(name, definition); },
    appendEntry() { throw new Error("recovery should not be created"); },
    async exec() { return { code: 1, stdout: "", stderr: "unavailable" }; },
  };
  let editor = "keep this draft";
  const ctx = {
    mode: "tui",
    ui: { getEditorText: () => editor, setEditorText: (text) => { editor = text; }, notify: () => {} },
  };
  const oldEnvironment = { HERDR_ENV: process.env.HERDR_ENV, HERDR_PANE_ID: process.env.HERDR_PANE_ID };
  process.env.HERDR_ENV = "1";
  process.env.HERDR_PANE_ID = "w1:p1";
  try {
    herdrAutoReload(pi);
    await commands.get("reload-herdr-sessions").handler("", ctx);
    assert.equal(editor, "keep this draft");
  } finally {
    if (oldEnvironment.HERDR_ENV === undefined) delete process.env.HERDR_ENV;
    else process.env.HERDR_ENV = oldEnvironment.HERDR_ENV;
    if (oldEnvironment.HERDR_PANE_ID === undefined) delete process.env.HERDR_PANE_ID;
    else process.env.HERDR_PANE_ID = oldEnvironment.HERDR_PANE_ID;
  }
});

test("preserves then restores an unsubmitted TUI prompt across reload", async () => {
  const commands = new Map();
  const events = new Map();
  const entries = [];
  let editor = "unsubmitted draft";
  let reloads = 0;
  const pi = {
    registerCommand(name, definition) { commands.set(name, definition); },
    on(name, handler) { events.set(name, handler); },
    appendEntry(customType, data) { entries.push({ type: "custom", customType, data }); },
    async exec(_command, args) {
      assert.deepEqual(args, ["agent", "list"]);
      return { code: 0, stdout: JSON.stringify({ result: { agents: [{ agent: "pi", pane_id: "w1:p1", agent_status: "idle" }] } }), stderr: "" };
    },
  };
  const ctx = {
    mode: "tui",
    sessionManager: { getEntries: () => entries },
    ui: { getEditorText: () => editor, setEditorText: (text) => { editor = text; }, notify: () => {} },
    reload: async () => { reloads += 1; },
  };
  const oldEnvironment = { HERDR_ENV: process.env.HERDR_ENV, HERDR_PANE_ID: process.env.HERDR_PANE_ID };
  process.env.HERDR_ENV = "1";
  process.env.HERDR_PANE_ID = "w1:p1";
  try {
    herdrAutoReload(pi);
    await commands.get("reload-herdr-sessions").handler("", ctx);
    assert.equal(editor, "");
    assert.equal(reloads, 1);
    assert.deepEqual(entries.at(-1).data, { state: "pending", text: "unsubmitted draft" });

    events.get("session_start")({}, ctx);
    assert.equal(editor, "unsubmitted draft");
    assert.deepEqual(entries.at(-1).data, { state: "restored" });
  } finally {
    if (oldEnvironment.HERDR_ENV === undefined) delete process.env.HERDR_ENV;
    else process.env.HERDR_ENV = oldEnvironment.HERDR_ENV;
    if (oldEnvironment.HERDR_PANE_ID === undefined) delete process.env.HERDR_PANE_ID;
    else process.env.HERDR_PANE_ID = oldEnvironment.HERDR_PANE_ID;
  }
});
