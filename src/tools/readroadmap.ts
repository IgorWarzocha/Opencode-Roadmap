/**
 * Tool for reading roadmap state, progress, and details.
 * Supports filtering by feature or action number.
 */
import { tool, type ToolDefinition } from "@opencode-ai/plugin"
import { FileStorage } from "../storage.js"
import { RoadmapValidator } from "../validators.js"
import type { Action, Feature } from "../types.js"
import { loadDescription } from "../descriptions/index.js"

export async function createReadRoadmapTool(directory: string): Promise<ToolDefinition> {
  const description = await loadDescription("readroadmap.txt")

  return tool({
    description,
    args: {
      actionNumber: tool.schema
        .string()
        .optional()
        .describe('Specific action to read ("1.01", "1.02", etc.). If not provided, reads entire roadmap.'),
      featureNumber: tool.schema
        .string()
        .optional()
        .describe('Specific feature to read ("1", "2", etc.). Use only if not providing actionNumber.'),
    },
    async execute(args) {
      const storage = new FileStorage(directory)

      if (!(await storage.exists())) {
        throw new Error("Roadmap not found. Use CreateRoadmap to create one.")
      }

      const document = await storage.read()
      if (!document) {
        throw new Error("Roadmap data is corrupted. Please fix manually.")
      }

      const roadmap = document.roadmap

      if (args.actionNumber && args.featureNumber) {
        throw new Error(
          "Cannot specify both actionNumber and featureNumber. Use one or the other, or neither for full roadmap.",
        )
      }

      if (args.actionNumber) {
        const actionNumberError = RoadmapValidator.validateActionNumber(args.actionNumber)
        if (actionNumberError) {
          throw new Error(`${actionNumberError.message} Use ReadRoadmap to see valid action numbers.`)
        }

        for (const feature of roadmap.features) {
          const action = feature.actions.find((a: Action) => a.number === args.actionNumber)
          if (action) {
            return (
              `Action ${args.actionNumber} from Feature "${feature.title}":\n` +
              `Description: ${action.description}\n` +
              `Status: ${action.status}\n` +
              `Feature: ${feature.number} - ${feature.title}\n` +
              `Feature Description: ${feature.description}`
            )
          }
        }

        throw new Error(
          `Action "${args.actionNumber}" not found. Use ReadRoadmap with no arguments to see all available actions.`,
        )
      }

      if (args.featureNumber) {
        const featureNumberError = RoadmapValidator.validateFeatureNumber(args.featureNumber)
        if (featureNumberError) {
          throw new Error(`${featureNumberError.message} Use ReadRoadmap to see valid feature numbers.`)
        }

        const feature = roadmap.features.find((f: Feature) => f.number === args.featureNumber)
        if (!feature) {
          throw new Error(
            `Feature "${args.featureNumber}" not found. Use ReadRoadmap with no arguments to see all available features.`,
          )
        }

        const actionList = feature.actions
          .map((action: Action) => `  ${action.number}: ${action.description} [${action.status}]`)
          .join("\n")

        const completedCount = feature.actions.filter((a: Action) => a.status === "completed").length
        const totalCount = feature.actions.length

        return (
          `Feature ${feature.number}: ${feature.title}\n` +
          `Description: ${feature.description}\n` +
          `Progress: ${completedCount}/${totalCount} actions completed\n` +
          `Actions:\n${actionList}`
        )
      }

      const totalActions = roadmap.features.reduce((sum: number, feature: Feature) => sum + feature.actions.length, 0)
      const completedActions = roadmap.features.reduce(
        (sum: number, feature: Feature) => sum + feature.actions.filter((a: Action) => a.status === "completed").length,
        0,
      )
      const inProgressActions = roadmap.features.reduce(
        (sum: number, feature: Feature) =>
          sum + feature.actions.filter((a: Action) => a.status === "in_progress").length,
        0,
      )
      const pendingActions = totalActions - completedActions - inProgressActions

      let output =
        `Project Roadmap Overview\n` +
        `========================\n` +
        `Feature: ${document.feature}\n` +
        `Spec:\n${document.spec}\n\n` +
        `Features: ${roadmap.features.length}\n` +
        `Total Actions: ${totalActions}\n` +
        `Progress: ${completedActions} completed, ${inProgressActions} in progress, ${pendingActions} pending\n\n`

      for (const feature of roadmap.features) {
        const featureCompleted = feature.actions.filter((a: Action) => a.status === "completed").length
        const featureTotal = feature.actions.length

        output += `Feature ${feature.number}: ${feature.title} (${featureCompleted}/${featureTotal} complete)\n`
        output += `  Description: ${feature.description}\n`

        for (const action of feature.actions) {
          const statusIcon = action.status === "completed" ? "✓" : action.status === "in_progress" ? "→" : "○"
          output += `  ${action.number} ${statusIcon} ${action.description} [${action.status}]\n`
        }
        output += "\n"
      }

      return output.trim()
    },
  })
}
