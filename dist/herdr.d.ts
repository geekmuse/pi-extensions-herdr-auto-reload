export interface HerdrAgent {
    agent: string;
    pane_id: string;
    agent_status: string;
}
/** Parse the JSON emitted by `herdr agent list` and retain live Pi agents. */
export declare function parsePiAgents(output: string): HerdrAgent[];
