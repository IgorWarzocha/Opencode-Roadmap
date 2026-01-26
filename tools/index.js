import { appendSpecTool } from "./append-spec";
import { createPlanTool } from "./create-plan";
import { createSpecTool } from "./create-spec";
import { markPlanDoneTool } from "./mark-plan-done";
import { readPlanTool } from "./read-plan";
export const createTools = (ctx) => ({
    createPlan: createPlanTool(ctx),
    createSpec: createSpecTool(ctx),
    readPlan: readPlanTool(ctx),
    appendSpec: appendSpecTool(ctx),
    markPlanDone: markPlanDoneTool(ctx),
});
