function isHerdrAgent(value) {
    if (value === null || typeof value !== "object")
        return false;
    const candidate = value;
    return typeof candidate.agent === "string"
        && typeof candidate.pane_id === "string"
        && typeof candidate.agent_status === "string";
}
/** Parse the JSON emitted by `herdr agent list` and retain live Pi agents. */
export function parsePiAgents(output) {
    let parsed;
    try {
        parsed = JSON.parse(output);
    }
    catch {
        throw new Error("Herdr returned invalid JSON for `agent list`.");
    }
    const agents = parsed.result?.agents;
    if (!Array.isArray(agents)) {
        throw new Error("Herdr returned an invalid agent list.");
    }
    return agents.filter(isHerdrAgent).filter((agent) => agent.agent === "pi");
}
