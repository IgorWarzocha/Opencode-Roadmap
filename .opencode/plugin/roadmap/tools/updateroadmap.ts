import { tool, type ToolDefinition } from "@opencode-ai/plugin"
import { FileStorage, RoadmapValidator } from "../storage"
import { ActionStatus } from "../types"
import { loadDescription } from "../descriptions"

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
      status: tool.schema.enum(["pending", "in_progress", "completed"]).describe("New action status - required"),
    },
    async execute(args: any) {
      const storage = new FileStorage(directory)

      if (!(await storage.exists())) {
        throw new Error("No roadmap exists. Use CreateRoadmap to create one.")
      }

      const roadmap = await storage.read()
      if (!roadmap) {
        throw new Error("Roadmap file is corrupted or unreadable. Ask user to check roadmap.json file.")
      }

      const actionNumberError = RoadmapValidator.validateActionNumber(args.actionNumber)
      if (actionNumberError) {
        throw new Error(`${actionNumberError.message} Use ReadRoadmap to see valid action numbers.`)
      }

      let targetAction: any = null
      let targetFeature: any = null
      let actionFound = false

      for (const feature of roadmap.features) {
        const action = feature.actions.find((a) => a.number === args.actionNumber)
        if (action) {
          targetAction = action
          targetFeature = feature
          actionFound = true
          break
        }
      }

      if (!actionFound) {
        throw new Error(`Action "${args.actionNumber}" not found. Use ReadRoadmap to see available action numbers.`)
      }

      const statusTransitionError = RoadmapValidator.validateStatusProgression(targetAction.status, args.status)
      if (statusTransitionError) {
        throw new Error(
          `${statusTransitionError.message} Current status: "${targetAction.status}", requested: "${args.status}"`,
        )
      }

      const oldStatus = targetAction.status
      const oldDescription = targetAction.description

      if (args.description !== undefined) {
        targetAction.description = args.description
      }

      targetAction.status = args.status as ActionStatus

      await storage.write(roadmap)

      const changes = []
      if (args.description !== undefined && oldDescription !== args.description) {
        changes.push(`description updated`)
      }
      if (oldStatus !== args.status) {
        changes.push(`status: "${oldStatus}" → "${args.status}"`)
      }

      return `Updated action ${args.actionNumber} in feature "${targetFeature.title}": ${changes.join(", ")}`
    },
  })
}
