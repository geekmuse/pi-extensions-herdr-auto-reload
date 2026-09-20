import assert from "node:assert/strict";
import test from "node:test";
import herdrAutoReload from "../dist/index.js";
import { parsePiAgents } from "../dist/herdr.js";

const registeredCommands = new Map();
const fakePi = {
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
