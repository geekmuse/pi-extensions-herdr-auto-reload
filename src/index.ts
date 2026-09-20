import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { parsePiAgents } from "./herdr.js";
import { findPendingPromptBuffer, PROMPT_BUFFER_ENTRY } from "./prompt-buffer.js";

const RELOAD_COMMAND = "/reload";
const COMMAND_NAME = "reload-herdr-sessions";

export default function herdrAutoReload(pi: ExtensionAPI) {
  pi.on("session_start", (_event, ctx) => {
    // RPC cannot read the editor buffer. TUI sessions can safely restore it after reload.
    if (ctx.mode !== "tui") return;

    const pending = findPendingPromptBuffer(ctx.sessionManager.getEntries());
    if (!pending) return;

    // Never overwrite text that appeared while this extension was reloading. Keep the durable backup instead.
    if (ctx.ui.getEditorText()) {
      ctx.ui.notify("Saved pre-reload prompt remains in session recovery because the editor is not empty.", "warning");
      return;
    }

    try {
      ctx.ui.setEditorText(pending.text);
      pi.appendEntry(PROMPT_BUFFER_ENTRY, { state: "restored" });
      ctx.ui.notify("Restored unsubmitted prompt text after reload.", "info");
    } catch {
      // Leave the pending entry as the durable recovery record for a later reload/restart.
      ctx.ui.notify("Could not restore the saved prompt; it remains in session recovery.", "error");
    }
  });

  pi.registerCommand(COMMAND_NAME, {
    description: "Reload all live Pi sessions managed by this Herdr server",
    handler: async (_args, ctx) => {
      if (process.env.HERDR_ENV !== "1" || !process.env.HERDR_PANE_ID) {
        ctx.ui.notify("/reload-herdr-sessions requires a Herdr-managed Pi pane.", "error");
        return;
      }

      const promptBuffer = ctx.mode === "tui" ? ctx.ui.getEditorText() : "";

      const listed = await pi.exec("herdr", ["agent", "list"], { timeout: 5_000 });
      if (listed.code !== 0) {
        ctx.ui.notify(`Could not list Herdr agents: ${listed.stderr || listed.stdout}`, "error");
        return;
      }

      const currentPane = process.env.HERDR_PANE_ID;
      const remoteAgents = parsePiAgents(listed.stdout).filter((agent) => agent.pane_id !== currentPane);
      const deliveries = await Promise.allSettled(
        remoteAgents.map(async (agent) => {
          const result = await pi.exec("herdr", ["agent", "prompt", agent.pane_id, RELOAD_COMMAND], { timeout: 5_000 });
          if (result.code !== 0) throw new Error(result.stderr || result.stdout || "Herdr rejected the reload request.");
          return agent.pane_id;
        }),
      );
      const delivered = deliveries.filter((result) => result.status === "fulfilled").length;
      const failed = deliveries.length - delivered;
      if (promptBuffer) {
        // appendEntry persists in Pi's session JSONL before the visible buffer is cleared.
        pi.appendEntry(PROMPT_BUFFER_ENTRY, { state: "pending", text: promptBuffer });
        ctx.ui.setEditorText("");
      }
      ctx.ui.notify(
        `Requested reload for ${delivered} remote Pi session${delivered === 1 ? "" : "s"}${failed ? `; ${failed} failed` : ""}. Reloading this session.`,
        failed ? "warning" : "info",
      );

      // ctx.reload() is the supported local equivalent of /reload. It must end this handler.
      await ctx.reload();
      return;
    },
  });
}
