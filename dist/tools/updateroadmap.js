import { tool } from "@opencode-ai/plugin";
import { FileStorage, RoadmapValidator } from "../storage";
import { loadDescription } from "../descriptions";
import { getErrorMessage } from "../errors/loader";
export async function createUpdateRoadmapTool(directory) {
    const description = await loadDescription("updateroadmap.txt");
    return tool({
        description,
        args: {
            actionNumber: tool.schema.string().describe('Action number to update ("1.01", "1.02", "2.01", etc.) - required'),
            description: tool.schema
                .string()
                .optional()
                .describe("New action description (full overwrite). If not provided, only status is updated."),
            status: tool.schema
                .enum(["pending", "in_progress", "completed"])
                .optional()
                .describe("New action status - optional if only updating description"),
        },
        async execute(args) {
            const storage = new FileStorage(directory);
            if (!(await storage.exists())) {
                throw new Error(await getErrorMessage("roadmap_not_found"));
            }
            const roadmap = await storage.read();
            if (!roadmap) {
                throw new Error(await getErrorMessage("roadmap_corrupted"));
            }
            const actionNumberError = await RoadmapValidator.validateActionNumber(args.actionNumber);
            if (actionNumberError) {
                throw new Error(`${actionNumberError.message} Use ReadRoadmap to see valid action numbers.`);
            }
            let targetAction = null;
            let targetFeature = null;
            let actionFound = false;
            for (const feature of roadmap.features) {
                const action = feature.actions.find((a) => a.number === args.actionNumber);
                if (action) {
                    targetAction = action;
                    targetFeature = feature;
                    actionFound = true;
                    break;
                }
            }
            if (!actionFound) {
                throw new Error(await getErrorMessage("action_not_found", { id: args.actionNumber }));
            }
            // Validate that at least one field is being updated
            if (args.description === undefined && args.status === undefined) {
                throw new Error(await getErrorMessage("no_changes_specified"));
            }
            const oldStatus = targetAction.status;
            const oldDescription = targetAction.description;
            // Validate description if provided
            if (args.description !== undefined) {
                const descError = await RoadmapValidator.validateDescription(args.description, "action");
                if (descError) {
                    throw new Error(`${descError.message}`);
                }
                targetAction.description = args.description;
            }
            // Validate and update status if provided
            if (args.status !== undefined) {
                const statusTransitionError = await RoadmapValidator.validateStatusProgression(targetAction.status, args.status);
                if (statusTransitionError) {
                    throw new Error(`${statusTransitionError.message} Current status: "${targetAction.status}", requested: "${args.status}"`);
                }
                targetAction.status = args.status;
            }
            await storage.write(roadmap);
            const changes = [];
            if (args.description !== undefined && oldDescription !== args.description) {
                changes.push(`description updated`);
            }
            if (args.status !== undefined && oldStatus !== args.status) {
                changes.push(`status: "${oldStatus}" → "${args.status}"`);
            }
            // Check if all actions are completed
            let allCompleted = true;
            for (const feature of roadmap.features) {
                for (const action of feature.actions) {
                    if (action.status !== "completed") {
                        allCompleted = false;
                        break;
                    }
                }
                if (!allCompleted)
                    break;
            }
            let archiveMsg = "";
            if (allCompleted) {
                const archiveName = await storage.archive();
                archiveMsg = `\n\n🎉 All actions completed! Roadmap archived to "${archiveName}".`;
            }
            return `Updated action ${args.actionNumber} in feature "${targetFeature.title}": ${changes.join(", ")}${archiveMsg}`;
        },
    });
}
