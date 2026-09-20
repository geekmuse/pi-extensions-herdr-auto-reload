export const PROMPT_BUFFER_ENTRY = "pi-herdr-auto-reload:prompt-buffer";
function isRecord(value) {
    return value !== null && typeof value === "object";
}
/** Return the newest unresolved prompt-buffer backup from the current session. */
export function findPendingPromptBuffer(entries) {
    for (let index = entries.length - 1; index >= 0; index -= 1) {
        const entry = entries[index];
        if (!isRecord(entry) || entry.type !== "custom" || entry.customType !== PROMPT_BUFFER_ENTRY || !isRecord(entry.data))
            continue;
        if (entry.data.state === "restored")
            return undefined;
        if (entry.data.state === "pending" && typeof entry.data.text === "string") {
            return { state: "pending", text: entry.data.text };
        }
    }
    return undefined;
}
