import { z } from "zod"

export const ActionStatus = z.enum(["pending", "in_progress", "completed", "cancelled"])
export type ActionStatus = z.infer<typeof ActionStatus>

export const Action = z.object({
  number: z
    .string()
    .describe('Action number as string with two decimals ("1.01", "1.02", etc.) - canonical ID, never changes'),
  description: z.string().describe("Action description - MUTABLE (overwrite only)"),
  status: ActionStatus.describe("Current status of this action - MUTABLE"),
})
export type Action = z.infer<typeof Action>

export const Feature = z.object({
  number: z.string().describe('Feature number as string ("1", "2", "3...") - canonical ID, never changes'),
  title: z.string().describe("Feature title"),
  description: z.string().describe("Brief description of what this feature accomplishes"),
  actions: z.array(Action).describe("Array of actions for this feature"),
})
export type Feature = z.infer<typeof Feature>

export const Roadmap = z.object({
  features: z.array(Feature).describe("Array of features in the roadmap"),
})
export type Roadmap = z.infer<typeof Roadmap>

export type RoadmapDocument = {
  feature: string
  spec: string
  roadmap: Roadmap
}

export interface RoadmapStorage {
  read(): Promise<RoadmapDocument | null>
  write(document: RoadmapDocument): Promise<void>
  exists(): Promise<boolean>
  archive(): Promise<string>
}

export interface ValidationError {
  code: string
  message: string
  tutorial?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export interface CreateRoadmapInput {
  feature: string
  spec: string
  features: {
    number: string
    title: string
    description: string
    actions: {
      number: string
      description: string
      status: "pending"
    }[]
  }[]
}

export interface UpdateRoadmapInput {
  actionNumber: string
  description?: string
  status?: ActionStatus
}

export interface ReadRoadmapInput {
  actionNumber?: string
  featureNumber?: string
}
