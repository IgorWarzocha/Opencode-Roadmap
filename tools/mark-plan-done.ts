/**
 * tools/mark-plan-done.ts
 * Marks a plan as done by normalizing frontmatter and updating status.
 * Expects completion to be verified before invoking this tool.
 */
import { tool } from "@opencode-ai/plugin"
import { getPlanPath, normalizePlanFrontmatter, validateName } from "../utils"
import type { Ctx } from "../types"

export const markPlanDoneTool = (ctx: Ctx) =>
  tool({
    description: "Mark plan status as done. MUST ensure the plan is fully completed before calling.",
    args: {
      name: tool.schema.string().describe("Target plan name (REQUIRED)"),
    },
    async execute(args) {
      if (!args.name) return "Error: 'name' parameter is REQUIRED."
      const nameCheck = validateName(args.name)
      if (!nameCheck.ok) return `Error: Invalid plan name '${args.name}': ${nameCheck.reason}.`

      const planPath = getPlanPath(ctx.directory, args.name)
      const planFile = Bun.file(planPath)
      if (!(await planFile.exists())) return `Plan '${args.name}' not found.`

      const content = await planFile.text()
      const statusMatch = content.match(/^plan status:\s*(\w+)\b/m)
      const status = statusMatch?.[1] ?? "active"
      if (status === "done") return `Plan '${args.name}' is already done.`

      const nameMatch = content.match(/^plan name:\s*(.+)$/m)
      const descMatch = content.match(/^plan description:\s*(.+)$/m)
      const planName = nameMatch?.[1]?.trim() || args.name
      const description = descMatch?.[1]?.trim() || ""
      const normalized = normalizePlanFrontmatter(content, planName, description, "done")

      const bytes = await Bun.write(planPath, normalized)
      if (bytes === 0) return `Error: Failed to update plan '${args.name}'.`

      return `Plan '${args.name}' marked as done.`
    },
  })
