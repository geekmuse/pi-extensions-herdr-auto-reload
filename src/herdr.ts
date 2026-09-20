export interface HerdrAgent {
  agent: string;
  pane_id: string;
  agent_status: string;
}

type AgentListResponse = {
  result?: {
    agents?: unknown;
  };
};

function isHerdrAgent(value: unknown): value is HerdrAgent {
  if (value === null || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.agent === "string"
    && typeof candidate.pane_id === "string"
    && typeof candidate.agent_status === "string";
}

/** Parse the JSON emitted by `herdr agent list` and retain live Pi agents. */
export function parsePiAgents(output: string): HerdrAgent[] {
  let parsed: AgentListResponse;
  try {
    parsed = JSON.parse(output) as AgentListResponse;
  } catch {
    throw new Error("Herdr returned invalid JSON for `agent list`.");
  }

  const agents = parsed.result?.agents;
  if (!Array.isArray(agents)) {
    throw new Error("Herdr returned an invalid agent list.");
  }

  return agents.filter(isHerdrAgent).filter((agent) => agent.agent === "pi");
}
