/**
 * tools/create-plan.ts
 * Implements plan creation with validation and frontmatter formatting.
 * Returns guidance about global specs after writing the plan.
 */
import { tool } from "@opencode-ai/plugin";
import { ensureDirectory, formatPlan, getPlanPath, validateName } from "../utils";
import { listRepoSpecs } from "./shared";
export const createPlanTool = (ctx) => tool({
    description: "Create a plan. Name MUST be [A-Za-z0-9-], max 3 words. Idea REQUIRED and detailed. SHORT description REQUIRED (3-5 words) and MUST NOT overlap with the plan name. Steps REQUIRED (min 5), specific and actionable. You SHOULD ask clarifying questions before creating a plan. After creating, review REPO scope specs and append relevant ones. Other agents MUST read the plan before major work.",
    args: {
        name: tool.schema.string().describe("Plan name MUST be [A-Za-z0-9-], max 3 words."),
        idea: tool.schema.string().describe("Plan idea (REQUIRED, detailed)"),
        description: tool.schema.string().describe("Plan SHORT description (REQUIRED, 3-5 words, NOT overlapping name)"),
        steps: tool.schema.array(tool.schema.string()).describe("Implementation steps (REQUIRED, min 5, specific)"),
    },
    async execute(args) {
        if (!args.name)
            return "Error: 'name' parameter is REQUIRED.";
        if (!args.description)
            return "Error: 'description' parameter is REQUIRED.";
        const words = args.description.trim().split(/\s+/).filter(Boolean).length;
        if (words < 3 || words > 10) {
            return "Error: 'description' parameter must be between 3 and 10 words.";
        }
        if (!args.steps || args.steps.length < 5) {
            return "Error: 'steps' parameter is REQUIRED and must include at least 5 steps.";
        }
        const nameCheck = validateName(args.name);
        if (!nameCheck.ok)
            return `Error: Invalid plan name '${args.name}': ${nameCheck.reason}.`;
        const path = getPlanPath(ctx.directory, args.name);
        if (await Bun.file(path).exists())
            return `Error: Plan '${args.name}' already exists. Use a unique name.`;
        await ensureDirectory(path, ctx.$);
        const content = formatPlan(args.idea || "", args.name, args.description, args.steps || []);
        const bytes = await Bun.write(path, content);
        if (bytes === 0 || !(await Bun.file(path).exists())) {
            return `Error: Failed to write plan '${args.name}' to disk. Please check permissions.`;
        }
        const repoSpecs = await listRepoSpecs(ctx.directory);
        if (repoSpecs.length === 0) {
            return `Plan '${args.name}' created successfully. No global specs detected; you MUST ask the user if they want to create some.`;
        }
        return `Plan '${args.name}' created successfully. You MUST consider the following global specs to be appended to this plan: ${repoSpecs.join(", ")}.`;
    },
});
