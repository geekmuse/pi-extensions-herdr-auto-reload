export declare const PROMPT_BUFFER_ENTRY = "pi-herdr-auto-reload:prompt-buffer";
export type PendingPromptBuffer = {
    state: "pending";
    text: string;
};
/** Return the newest unresolved prompt-buffer backup from the current session. */
export declare function findPendingPromptBuffer(entries: readonly unknown[]): PendingPromptBuffer | undefined;
