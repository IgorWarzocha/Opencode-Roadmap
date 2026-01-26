/**
 * tools/append-spec.ts
 * Links a spec to a plan by updating the spec block.
 * Uses merge logic to reduce race losses and keeps markers stable.
 */
import { tool } from "@opencode-ai/plugin"
import { getPlanPath, getSpecPath, validateName } from "../utils"
import type { Ctx } from "../types"
import { endToken, findSpecBlock, parseSpecLines, startToken, writeWithMerge } from "./shared"

export const appendSpecTool = (ctx: Ctx) =>
  tool({
    description: "Link spec to plan. Spec MUST exist. MUST NOT call in batch/parallel; use sequential calls.",
    args: {
      planName: tool.schema.string().describe("Target plan name (REQUIRED)"),
      specName: tool.schema.string().describe("Spec name to link (REQUIRED)"),
    },
    async execute(args) {
      if (!args.planName) return "Error: 'planName' parameter is REQUIRED."
      if (!args.specName) return "Error: 'specName' parameter is REQUIRED."

      const planCheck = validateName(args.planName)
      if (!planCheck.ok) return `Error: Invalid plan name '${args.planName}': ${planCheck.reason}.`

      const specCheck = validateName(args.specName)
      if (!specCheck.ok) return `Error: Invalid spec name '${args.specName}': ${specCheck.reason}.`

      const planPath = getPlanPath(ctx.directory, args.planName)
      const planFile = Bun.file(planPath)
      if (!(await planFile.exists())) return `Plan '${args.planName}' not found.`

      const specPath = getSpecPath(ctx.directory, args.specName)
      if (!(await Bun.file(specPath).exists())) return `Spec '${args.specName}' not found. Please create it first.`

      const content = await planFile.text()
      const block = findSpecBlock(content)
      const specLink = `- ${args.specName}`

      if (!block) {
        const appended = `${content}\n\n## Required Specs\n${startToken}\n${specLink}\n${endToken}`
        const bytes = await Bun.write(planPath, appended)
        if (bytes === 0) return `Error: Failed to update plan '${args.planName}'.`
        return `Linked spec '${args.specName}' to plan '${args.planName}'`
      }

      const existing = parseSpecLines(block.middle)
      if (existing.includes(args.specName)) {
        return `Spec '${args.specName}' is already linked to plan '${args.planName}'.`
      }

      const result = await writeWithMerge(planPath, args.specName)
      if (!result.ok) {
        return `Error: Failed to update plan '${args.planName}': ${result.reason}.`
      }

      return `Linked spec '${args.specName}' to plan '${args.planName}'`
    },
  })
