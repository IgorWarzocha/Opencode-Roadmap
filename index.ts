/**
 * index.ts
 * Wires plugin hooks and tool registrations for the plan/spec workflow.
 * Keeps entrypoint minimal and delegates behavior to modules.
 */
import type { Hooks, Plugin } from "@opencode-ai/plugin"
import { createBundledSkillsHook } from "./skills"
import { createTools } from "./tools"
import { systemHooks } from "./hooks"

export const PlanPlugin: Plugin = async (ctx) => {
  const skillsHook = createBundledSkillsHook()
  const config: Hooks["config"] = async (value) => {
    await skillsHook.config?.(value)
  }

  return {
    config,
    tool: createTools(ctx),
    ...systemHooks(ctx),
  }
}

export default PlanPlugin
