/**
 * Tool for creating and appending to project roadmaps.
 * Supports merge logic for adding new features/actions to existing roadmaps.
 */
import { tool, type ToolDefinition } from "@opencode-ai/plugin"
import { FileStorage, RoadmapValidator } from "../storage.js"
import type { Action, Feature, Roadmap } from "../types.js"
import { loadDescription } from "../descriptions/index.js"
import { getErrorMessage } from "../errors/loader.js"

interface InputAction {
  number: string
  description: string
  status: "pending"
}

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
    async execute(args) {
      const storage = new FileStorage(directory)

      if (!args.features || args.features.length === 0) {
        throw new Error(
          'Roadmap must have at least one feature with at least one action. Example: {"features": [{"number": "1", "title": "Feature 1", "description": "Description", "actions": [{"number": "1.01", "description": "Action 1", "status": "pending"}]}]}',
        )
      }

      return await storage.update(async (current) => {
        const roadmap: Roadmap = current ?? { features: [] }
        const isUpdate = current !== null
        const validationErrors: { message: string }[] = []

        // First pass: structural validation of input
        for (const feature of args.features) {
          if (!feature.actions || feature.actions.length === 0) {
            throw new Error(
              `Feature "${feature.number}" must have at least one action. Each feature needs at least one action to be valid.`,
            )
          }

          const titleError = RoadmapValidator.validateTitle(feature.title, "feature")
          if (titleError) validationErrors.push(titleError)

          const descError = RoadmapValidator.validateDescription(feature.description, "feature")
          if (descError) validationErrors.push(descError)

          for (const action of feature.actions) {
            const actionTitleError = RoadmapValidator.validateTitle(action.description, "action")
            if (actionTitleError) validationErrors.push(actionTitleError)
          }
        }

        // Validate sequence consistency of input (internal consistency)
        const sequenceErrors = RoadmapValidator.validateFeatureSequence(args.features)
        validationErrors.push(...sequenceErrors)

        if (validationErrors.length > 0) {
          const errorMessages = validationErrors.map((err) => err.message).join("\n")
          throw new Error(`Validation errors:\n${errorMessages}\n\nPlease fix these issues and try again.`)
        }

        // Merge Logic
        for (const inputFeature of args.features) {
          const existingFeature = roadmap.features.find((f: Feature) => f.number === inputFeature.number)

          if (existingFeature) {
            // Feature exists: Validate Immutability
            if (
              existingFeature.title !== inputFeature.title ||
              existingFeature.description !== inputFeature.description
            ) {
              const msg = await getErrorMessage("immutable_feature", {
                id: inputFeature.number,
                oldTitle: existingFeature.title,
                oldDesc: existingFeature.description,
                newTitle: inputFeature.title,
                newDesc: inputFeature.description,
              })
              throw new Error(msg)
            }

            // Process Actions
            for (const inputAction of inputFeature.actions) {
              const existingAction = existingFeature.actions.find((a: Action) => a.number === inputAction.number)
              if (existingAction) {
                // Action exists: skip (immutable)
                continue
              } else {
                // New Action: Append
                existingFeature.actions.push({
                  number: inputAction.number,
                  description: inputAction.description,
                  status: inputAction.status,
                })
                // Sort actions to ensure order
                existingFeature.actions.sort((a: Action, b: Action) => parseFloat(a.number) - parseFloat(b.number))
              }
            }
          } else {
            // New Feature: Append
            roadmap.features.push({
              number: inputFeature.number,
              title: inputFeature.title,
              description: inputFeature.description,
              actions: inputFeature.actions.map((a: InputAction) => ({
                number: a.number,
                description: a.description,
                status: a.status,
              })),
            })
          }
        }

        // Final Sort of Features
        roadmap.features.sort((a: Feature, b: Feature) => parseInt(a.number) - parseInt(b.number))

        // Safety check: ensure no feature ended up with zero actions after merge
        for (const feature of roadmap.features) {
          if (feature.actions.length === 0) {
            throw new Error(`Feature "${feature.number}" has no actions. This indicates a merge error.`)
          }
        }

        // Final Validation of the Merged Roadmap
        const finalErrors = RoadmapValidator.validateFeatureSequence(roadmap.features)
        if (finalErrors.length > 0) {
          throw new Error(`Resulting roadmap would be invalid:\n${finalErrors.map((e) => e.message).join("\n")}`)
        }

        const totalActions = roadmap.features.reduce((sum: number, feature: Feature) => sum + feature.actions.length, 0)
        const action = isUpdate ? "Updated" : "Created"
        const summary =
          `${action} roadmap with ${roadmap.features.length} features and ${totalActions} actions:\n` +
          roadmap.features
            .map(
              (feature: Feature) => `  Feature ${feature.number}: ${feature.title} (${feature.actions.length} actions)`,
            )
            .join("\n")

        return {
          roadmap,
          buildResult: () => summary,
        }
      })
    },
  })
}
