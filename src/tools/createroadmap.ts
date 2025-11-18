import { tool, type ToolDefinition } from "@opencode-ai/plugin"
import { FileStorage, RoadmapValidator } from "../storage"
import { Roadmap } from "../types"
import { loadDescription } from "../descriptions"

export async function createCreateRoadmapTool(directory: string): Promise<ToolDefinition> {
  const description = await loadDescription("createroadmap.txt")

  return tool({
    description,
    args: {
      features: tool.schema
        .array(
          tool.schema.object({
            number: tool.schema.string().describe('Feature number as string ("1", "2", "3...")'),
            title: tool.schema.string().describe("Feature title"),
            description: tool.schema.string().describe("Brief description of what this feature accomplishes"),
            actions: tool.schema
              .array(
                tool.schema.object({
                  number: tool.schema
                    .string()
                    .describe('Action number as string with two decimals ("1.01", "1.02", etc.)'),
                  description: tool.schema.string().describe("Action description"),
                  status: tool.schema.enum(["pending"]).describe('Initial action status (must be "pending")'),
                }),
              )
              .describe("List of actions for this feature in order"),
          }),
        )
        .describe("Array of features for roadmap"),
    },
    async execute(args: any) {
      const storage = new FileStorage(directory)

      if (await storage.exists()) {
        throw new Error("Roadmap already exists. Ask user to archive current roadmap manually. Do not remove yourself.")
      }

      if (!args.features || args.features.length === 0) {
        throw new Error(
          'Roadmap must have at least one feature with at least one action. Example: {"features": [{"number": "1", "title": "Feature 1", "description": "Description", "actions": [{"number": "1.01", "description": "Action 1", "status": "pending"}]}]}',
        )
      }

      for (const feature of args.features) {
        if (!feature.actions || feature.actions.length === 0) {
          throw new Error(
            `Feature "${feature.number}" must have at least one action. Each feature needs at least one action to be valid.`,
          )
        }
      }

      const validationErrors = RoadmapValidator.validateFeatureSequence(args.features)

      if (validationErrors.length > 0) {
        const errorMessages = validationErrors.map((err) => err.message).join("\n")
        throw new Error(`Validation errors:\n${errorMessages}\n\nPlease fix these issues and try again.`)
      }

      const roadmap: Roadmap = {
        features: args.features.map((feature: any) => ({
          number: feature.number,
          title: feature.title,
          description: feature.description,
          actions: feature.actions.map((action: any) => ({
            number: action.number,
            description: action.description,
            status: action.status,
          })),
        })),
      }

      await storage.write(roadmap)

      const totalActions = roadmap.features.reduce((sum, feature) => sum + feature.actions.length, 0)
      const summary =
        `Created roadmap with ${roadmap.features.length} features and ${totalActions} actions:\n` +
        roadmap.features
          .map((feature) => `  Feature ${feature.number}: ${feature.title} (${feature.actions.length} actions)`)
          .join("\n")

      return summary
    },
  })
}
