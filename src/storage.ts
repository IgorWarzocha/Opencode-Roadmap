import { promises as fs } from "fs"
import { join } from "path"
import type { Roadmap, RoadmapStorage, ValidationError } from "./types"
import { getErrorMessage } from "./errors/loader"

const ROADMAP_FILE = "roadmap.json"

export class FileStorage implements RoadmapStorage {
  constructor(private directory: string) {}

  async exists(): Promise<boolean> {
    try {
      await fs.access(join(this.directory, ROADMAP_FILE))
      return true
    } catch {
      return false
    }
  }

  async read(): Promise<Roadmap | null> {
    try {
      const filePath = join(this.directory, ROADMAP_FILE)
      const data = await fs.readFile(filePath, "utf-8")

      if (!data.trim()) {
        return null
      }

      const parsed = JSON.parse(data)

      if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid roadmap format: not an object")
      }

      if (!Array.isArray(parsed.features)) {
        throw new Error("Invalid roadmap format: missing or invalid features array")
      }

      return parsed as Roadmap
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error("Roadmap file contains invalid JSON. File may be corrupted.")
      }
      if (error instanceof Error && error.message.includes("ENOENT")) {
        return null
      }
      throw error
    }
  }

  async write(roadmap: Roadmap): Promise<void> {
    const filePath = join(this.directory, ROADMAP_FILE)
    const tempPath = join(this.directory, `${ROADMAP_FILE}.tmp.${Date.now()}`)

    try {
      const data = JSON.stringify(roadmap, null, 2)
      await fs.writeFile(tempPath, data, "utf-8")
      await fs.rename(tempPath, filePath)
    } catch (error) {
      try {
        await fs.unlink(tempPath)
      } catch {
        // Ignore cleanup errors
      }
      throw error
    }
  }

  async archive(): Promise<string> {
    const filePath = join(this.directory, ROADMAP_FILE)
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const archiveFilename = `roadmap.archive.${timestamp}.json`
    const archivePath = join(this.directory, archiveFilename)

    await fs.rename(filePath, archivePath)
    return archiveFilename
  }
}

export class RoadmapValidator {
  static async validateFeatureNumber(number: string): Promise<ValidationError | null> {
    if (!number || typeof number !== "string") {
      return {
        code: "INVALID_FEATURE_NUMBER",
        message: await getErrorMessage("invalid_feature_id", { id: "undefined" }),
      }
    }

    if (!/^\d+$/.test(number)) {
      return {
        code: "INVALID_FEATURE_NUMBER_FORMAT",
        message: await getErrorMessage("invalid_feature_id", { id: number }),
      }
    }

    return null
  }

  static async validateActionNumber(number: string): Promise<ValidationError | null> {
    if (!number || typeof number !== "string") {
      return {
        code: "INVALID_ACTION_NUMBER",
        message: await getErrorMessage("invalid_action_id", { id: "undefined" }),
      }
    }

    if (!/^\d+\.\d{2}$/.test(number)) {
      return {
        code: "INVALID_ACTION_NUMBER_FORMAT",
        message: await getErrorMessage("invalid_action_id", { id: number }),
      }
    }

    return null
  }

  static async validateActionSequence(
    actions: Array<{ number: string }>, 
    globalSeenNumbers?: Set<string>,
    featureNumber?: string
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = []
    const seenNumbers = new Set<string>()

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i]
      const numberError = await this.validateActionNumber(action.number)

      if (numberError) {
        errors.push(numberError)
        continue
      }

      // Check action-feature mismatch
      if (featureNumber) {
        const actionFeaturePrefix = action.number.split('.')[0]
        if (actionFeaturePrefix !== featureNumber) {
          errors.push({
            code: "ACTION_FEATURE_MISMATCH",
            message: await getErrorMessage("action_mismatch", { action: action.number, feature: featureNumber }),
          })
        }
      }

      // Check for duplicates within this feature
      if (seenNumbers.has(action.number)) {
        errors.push({
          code: "DUPLICATE_ACTION_NUMBER",
          message: `Duplicate action ID "${action.number}".`,
        })
      }

      // Check for global duplicates
      if (globalSeenNumbers?.has(action.number)) {
        errors.push({
          code: "DUPLICATE_ACTION_NUMBER_GLOBAL",
          message: `Duplicate action ID "${action.number}" (exists in another feature).`,
        })
      }

      seenNumbers.add(action.number)
      globalSeenNumbers?.add(action.number)
    }

    return errors
  }

  static async validateFeatureSequence(
    features: Array<{ number: string; actions: Array<{ number: string }> }>,
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = []
    const seenNumbers = new Set<string>()
    const seenActionNumbers = new Set<string>()

    for (let i = 0; i < features.length; i++) {
      const feature = features[i]
      const numberError = await this.validateFeatureNumber(feature.number)

      if (numberError) {
        errors.push(numberError)
        continue
      }

      if (seenNumbers.has(feature.number)) {
        errors.push({
          code: "DUPLICATE_FEATURE_NUMBER",
          message: `Duplicate feature ID "${feature.number}".`,
        })
      }

      seenNumbers.add(feature.number)

      const actionErrors = await this.validateActionSequence(feature.actions, seenActionNumbers, feature.number)
      errors.push(...actionErrors)
    }

    return errors
  }

  static async validateTitle(title: string, fieldType: "feature" | "action"): Promise<ValidationError | null> {
    if (!title || typeof title !== "string") {
      return {
        code: "INVALID_TITLE",
        message: `Invalid ${fieldType} title. Must be non-empty string.`,
      }
    }

    if (title.trim() === "") {
      return {
        code: "EMPTY_TITLE",
        message: `${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} title cannot be empty.`,
      }
    }

    return null
  }

  static async validateDescription(description: string, fieldType: "feature" | "action"): Promise<ValidationError | null> {
    if (!description || typeof description !== "string") {
      return {
        code: "INVALID_DESCRIPTION",
        message: `Invalid ${fieldType} description. Must be non-empty string.`,
      }
    }

    if (description.trim() === "") {
      return {
        code: "EMPTY_DESCRIPTION",
        message: `${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} description cannot be empty.`,
      }
    }

    return null
  }

  static async validateStatusProgression(currentStatus: string, newStatus: string): Promise<ValidationError | null> {
    const statusFlow = {
      pending: ["in_progress", "completed"],
      in_progress: ["completed"],
      completed: [],
    }

    const allowedTransitions = statusFlow[currentStatus as keyof typeof statusFlow] || []

    if (!(allowedTransitions as string[]).includes(newStatus)) {
      return {
        code: "INVALID_STATUS_TRANSITION",
        message: await getErrorMessage("invalid_transition", { 
            from: currentStatus, 
            to: newStatus, 
            allowed: allowedTransitions.length > 0 ? allowedTransitions.join(", ") : "None (terminal state)" 
        }),
      }
    }

    return null
  }
}
