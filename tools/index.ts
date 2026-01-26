/**
 * tools/index.ts
 * Assembles tool definitions into a single registry for the plugin.
 * Keeps tool wiring separate from tool implementations.
 */
import type { Ctx } from "../types"
import { appendSpecTool } from "./append-spec"
import { createPlanTool } from "./create-plan"
import { createSpecTool } from "./create-spec"
import { markPlanDoneTool } from "./mark-plan-done"
import { readPlanTool } from "./read-plan"

export const createTools = (ctx: Ctx) => ({
  createPlan: createPlanTool(ctx),
  createSpec: createSpecTool(ctx),
  readPlan: readPlanTool(ctx),
  appendSpec: appendSpecTool(ctx),
  markPlanDone: markPlanDoneTool(ctx),
})
