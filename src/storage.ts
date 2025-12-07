import { promises as fs } from "fs"
import { join } from "path"
import type { Roadmap, RoadmapStorage, ValidationError } from "./types.js"
import { Roadmap as RoadmapSchema } from "./types.js"

const ROADMAP_FILE = "roadmap.json"

export class FileStorage implements RoadmapStorage {
  private readonly directory: string

  constructor(directory: string) {
    this.directory = directory
  }

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

      const parsed: unknown = JSON.parse(data)
      const validated = RoadmapSchema.parse(parsed)
      return validated
    } catch (error: unknown) {
      if (error instanceof SyntaxError) {
        throw new Error("Roadmap file contains invalid JSON. File may be corrupted.")
      }
      if (error instanceof Error && error.message.includes("ENOENT")) {
        return null
      }
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Unknown error while reading roadmap")
    }
  }

  async write(roadmap: Roadmap): Promise<void> {
    const filePath = join(this.directory, ROADMAP_FILE)
    const tempPath = join(this.directory, `${ROADMAP_FILE}.tmp.${Date.now()}`)

    try {
      const data = JSON.stringify(roadmap, null, 2)
      await fs.writeFile(tempPath, data, "utf-8")
      await fs.rename(tempPath, filePath)
    } catch (error: unknown) {
      try {
        await fs.unlink(tempPath)
      } catch {
        // Ignore cleanup errors
      }
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Unknown error while writing roadmap")
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
  static validateFeatureNumber(number: string): ValidationError | null {
    if (!number || typeof number !== "string") {
      return {
        code: "INVALID_FEATURE_NUMBER",
        message: "Invalid feature ID: must be a string.",
      }
    }

    if (!/^\d+$/.test(number)) {
      return {
        code: "INVALID_FEATURE_NUMBER_FORMAT",
        message: "Invalid feature ID format: must be a simple number.",
      }
    }

    return null
  }

  static validateActionNumber(number: string): ValidationError | null {
    if (!number || typeof number !== "string") {
      return {
        code: "INVALID_ACTION_NUMBER",
        message: "Invalid action ID: must be a string.",
      }
    }

    if (!/^\d+\.\d{2}$/.test(number)) {
      return {
        code: "INVALID_ACTION_NUMBER_FORMAT",
        message: "Invalid action ID format: must be X.YY (e.g., 1.01).",
      }
    }

    return null
  }

  static validateActionSequence(
    actions: { number: string }[], 
    globalSeenNumbers?: Set<string>,
    featureNumber?: string
  ): ValidationError[] {
    const errors: ValidationError[] = []
    const seenNumbers = new Set<string>()

    for (const action of actions) {
      const numberError = this.validateActionNumber(action.number)

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
            message: `Action "${action.number}" does not belong to feature "${featureNumber}".`,
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

  static validateFeatureSequence(
    features: { number: string; actions: { number: string }[] }[],
  ): ValidationError[] {
    const errors: ValidationError[] = []
    const seenNumbers = new Set<string>()
    const seenActionNumbers = new Set<string>()

    for (const feature of features) {
      const numberError = this.validateFeatureNumber(feature.number)

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

      const actionErrors = this.validateActionSequence(feature.actions, seenActionNumbers, feature.number)
      errors.push(...actionErrors)
    }

    return errors
  }

  static validateTitle(title: string, fieldType: "feature" | "action"): ValidationError | null {
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

  static validateDescription(description: string, fieldType: "feature" | "action"): ValidationError | null {
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

  static validateStatusProgression(currentStatus: string, newStatus: string): ValidationError | null {
    const statusFlow = {
      pending: ["in_progress", "completed"],
      in_progress: ["completed"],
      completed: [],
    }

    const allowedTransitions = statusFlow[currentStatus as keyof typeof statusFlow] || []

    if (!(allowedTransitions as string[]).includes(newStatus)) {
      return {
        code: "INVALID_STATUS_TRANSITION",
        message: `Invalid transition from "${currentStatus}" to "${newStatus}". Allowed: ${allowedTransitions.length > 0 ? allowedTransitions.join(", ") : "None (terminal state)"}`,
      }
    }

    return null
  }
}
