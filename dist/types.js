import { z } from "zod";
export const ActionStatus = z.enum(["pending", "in_progress", "completed"]);
export const Action = z.object({
    number: z
        .string()
        .describe('Action number as string with two decimals ("1.01", "1.02", etc.) - canonical ID, never changes'),
    description: z.string().describe("Action description - MUTABLE (overwrite only)"),
    status: ActionStatus.describe("Current status of this action - MUTABLE"),
});
export const Feature = z.object({
    number: z.string().describe('Feature number as string ("1", "2", "3...") - canonical ID, never changes'),
    title: z.string().describe("Feature title"),
    description: z.string().describe("Brief description of what this feature accomplishes"),
    actions: z.array(Action).describe("Array of actions for this feature"),
});
export const Roadmap = z.object({
    features: z.array(Feature).describe("Array of features in the roadmap"),
});
