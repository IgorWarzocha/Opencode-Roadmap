/**
 * Tool for updating action status and descriptions in a roadmap.
 * Enforces forward-only status progression and archives when complete.
 */
import { tool, type ToolDefinition } from "@opencode-ai/plugin"
import { FileStorage } from "../storage.js"
import { RoadmapValidator } from "../validators.js"
import type { Action } from "../types.js"
import { loadDescription } from "../descriptions/index.js"

export async function createUpdateRoadmapTool(directory: string): Promise<ToolDefinition> {
  const description = await loadDescription("updateroadmap.txt")

  return tool({
    description,
    args: {
      actionNumber: tool.schema.string().describe('Action number to update ("1.01", "1.02", "2.01", etc.) - required'),
      description: tool.schema
        .string()
        .optional()
        .describe("New action description (full overwrite). If not provided, only status is updated."),
      status: tool.schema
        .enum(["pending", "in_progress", "completed", "cancelled"])
        .optional()
        .describe("New action status. Flexible transitions allowed except from cancelled."),
    },
    async execute(args) {
      const storage = new FileStorage(directory)

      const actionNumberError = RoadmapValidator.validateActionNumber(args.actionNumber)
      if (actionNumberError) {
        throw new Error(`${actionNumberError.message} Use ReadRoadmap to see valid action numbers.`)
      }

      return await storage.update((document) => {
        if (!document) {
          throw new Error("Roadmap not found. Use CreateRoadmap to create one.")
        }

        const roadmap = document.roadmap
        let targetAction: { status: string; description: string } | null = null
        let targetFeature: {
          number: string
          title: string
          description: string
          actions: { number: string; status: string; description: string }[]
        } | null = null
        let actionFound = false

        for (const feature of roadmap.features) {
          const action = feature.actions.find((a: Action) => a.number === args.actionNumber)
          if (action) {
            targetAction = action
            targetFeature = feature
            actionFound = true
            break
          }
        }

        if (!actionFound) {
          throw new Error(`Action "${args.actionNumber}" not found. Use ReadRoadmap to see valid action numbers.`)
        }

        if (!targetAction || !targetFeature) {
          throw new Error("Internal error: target action not found.")
        }

        // Validate that at least one field is being updated
        if (args.description === undefined && args.status === undefined) {
          throw new Error("No changes specified. Please provide description and/or status.")
        }

        const oldStatus = targetAction.status
        const oldDescription = targetAction.description

        // Validate description if provided
        if (args.description !== undefined) {
          const descError = RoadmapValidator.validateDescription(args.description, "action")
          if (descError) {
            throw new Error(`${descError.message}`)
          }
          targetAction.description = args.description
        }

        // Validate and update status if provided
        if (args.status !== undefined) {
          const statusTransitionError = RoadmapValidator.validateStatusProgression(targetAction.status, args.status)
          if (statusTransitionError) {
            throw new Error(
              `${statusTransitionError.message} Current status: "${targetAction.status}", requested: "${args.status}"`,
            )
          }
          targetAction.status = args.status
        }

        const changes: string[] = []
        if (args.description !== undefined && oldDescription !== args.description) {
          changes.push("description updated")
        }
        if (args.status !== undefined && oldStatus !== args.status) {
          changes.push(`status: "${oldStatus}" → "${args.status}"`)
        }

        if (changes.length === 0) {
          return {
            document: {
              feature: document.feature,
              spec: document.spec,
              roadmap,
            },
            buildResult: () => `Action ${args.actionNumber} unchanged. Provided values match current state.`,
          }
        }

        // Check if all actions are completed
        let allCompleted = true
        for (const feature of roadmap.features) {
          for (const action of feature.actions) {
            if (action.status !== "completed") {
              allCompleted = false
              break
            }
          }
          if (!allCompleted) break
        }

        // Format feature context
        const featureCompleted = targetFeature.actions.filter((a) => a.status === "completed").length
        const featureTotal = targetFeature.actions.length

        let featureContext = `\n\nFeature ${targetFeature.number}: ${targetFeature.title} (${featureCompleted}/${featureTotal} complete)\n`
        featureContext += `Description: ${targetFeature.description}\n`

        for (const action of targetFeature.actions) {
          const statusIcon = action.status === "completed" ? "✓" : action.status === "in_progress" ? "→" : "○"
          featureContext += `${action.number} ${statusIcon} ${action.description} [${action.status}]\n`
        }

        return {
          document: {
            feature: document.feature,
            spec: document.spec,
            roadmap,
          },
          archive: allCompleted,
          buildResult: (archiveName) => {
            const archiveMsg = archiveName ? `\n\nAll actions completed! Roadmap archived to "${archiveName}".` : ""
            return `Updated action ${args.actionNumber} in feature "${targetFeature.title}": ${changes.join(", ")}${featureContext}${archiveMsg}`
          },
        }
      })
    },
  })
}
