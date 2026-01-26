/**
 * tools/read-plan.ts
 * Reads a plan and expands linked specs into the output.
 * Normalizes frontmatter before parsing the spec block.
 */
import { tool } from "@opencode-ai/plugin"
import { getPlanPath, getSpecPath, normalizePlanFrontmatter, validateName } from "../utils"
import type { Ctx } from "../types"
import { findSpecBlock, parseSpecLines } from "./shared"

export const readPlanTool = (ctx: Ctx) =>
  tool({
    description: "Read a plan with linked spec content. MUST be read before major work.",
    args: {
      name: tool.schema.string().describe("Existing plan name (REQUIRED)"),
    },
    async execute(args) {
      if (!args.name) return "Error: 'name' parameter is REQUIRED."
      const nameCheck = validateName(args.name)
      if (!nameCheck.ok) return `Error: Invalid plan name '${args.name}': ${nameCheck.reason}.`
      const planPath = getPlanPath(ctx.directory, args.name)
      const planFile = Bun.file(planPath)
      if (!(await planFile.exists())) return `Plan '${args.name}' not found.`

      const content = await planFile.text()
      const nameMatch = content.match(/^plan name:\s*(.+)$/m)
      const descMatch = content.match(/^plan description:\s*(.+)$/m)
      const statusMatch = content.match(/^plan status:\s*(\w+)\b/m)
      const planName = nameMatch?.[1]?.trim() || args.name
      const description = descMatch?.[1]?.trim() || ""
      const status = statusMatch?.[1] ?? "active"
      const normalized = normalizePlanFrontmatter(content, planName, description, status)
      const block = findSpecBlock(normalized)
      if (!block) return normalized

      const specs = parseSpecLines(block.middle)
      if (specs.length === 0) return normalized

      const specChunks = await Promise.all(
        specs.map(async (specName) => {
          const specPath = getSpecPath(ctx.directory, specName)
          const specFile = Bun.file(specPath)
          if (await specFile.exists()) return `\n### Spec: ${specName}\n${await specFile.text()}\n`
          return `\n### Spec: ${specName} (NOT FOUND)\n`
        }),
      )

      const specContent = "\n\n## Associated Specs\n" + specChunks.join("")
      return normalized + specContent
    },
  })
