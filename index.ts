/**
 * index.ts
 * Wires plugin hooks and tool registrations for the plan/spec workflow.
 * Keeps entrypoint minimal and delegates behavior to modules.
 */
import type { Plugin } from "@opencode-ai/plugin"
import { createTools } from "./tools"
import { systemHooks } from "./hooks"

export const PlanPlugin: Plugin = async (ctx) => {
  return {
    tool: createTools(ctx),
    ...systemHooks(ctx),
  }
}

export default PlanPlugin
