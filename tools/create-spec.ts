/**
 * tools/create-spec.ts
 * Implements spec creation with scope validation and formatted output.
 * Encourages reuse while keeping names constrained.
 */
import { tool } from "@opencode-ai/plugin"
import { ensureDirectory, formatSpec, getSpecPath, validateName } from "../utils"
import type { Ctx } from "../types"

export const createSpecTool = (ctx: Ctx) =>
  tool({
    description:
      "Create a spec. Specs SHOULD be reusable. Name MUST be [A-Za-z0-9-], max 3 words. You SHOULD ask clarifying questions before creating a spec.",
    args: {
      name: tool.schema.string().describe("Spec name MUST be [A-Za-z0-9-], max 3 words."),
      scope: tool.schema.enum(["repo", "feature"]).describe("Scope MUST be repo or feature."),
      content: tool.schema.string().describe("Spec content (REUSABLE, markdown OK)"),
    },
    async execute(args) {
      if (!args.name) return "Error: 'name' parameter is REQUIRED."
      if (!args.content) return "Error: 'content' parameter is REQUIRED."
      if (args.scope !== "repo" && args.scope !== "feature") {
        return "Error: 'scope' parameter is REQUIRED and must be 'repo' or 'feature'."
      }
      const nameCheck = validateName(args.name)
      if (!nameCheck.ok) return `Error: Invalid spec name '${args.name}': ${nameCheck.reason}.`
      const path = getSpecPath(ctx.directory, args.name)
      if (await Bun.file(path).exists()) return `Error: Spec '${args.name}' already exists. Use a unique name.`

      await ensureDirectory(path, ctx.$)
      const content = formatSpec(args.name, args.scope, args.content)
      const bytes = await Bun.write(path, content)

      if (bytes === 0 || !(await Bun.file(path).exists())) {
        return `Error: Failed to write spec '${args.name}' to disk. Please check permissions.`
      }

      return `Spec '${args.name}' created successfully.`
    },
  })
