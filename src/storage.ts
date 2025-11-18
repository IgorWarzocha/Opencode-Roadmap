import { promises as fs } from "fs"
import { join } from "path"
import type { Roadmap, RoadmapStorage, ValidationError } from "./types"

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
}

export class RoadmapValidator {
  static validateFeatureNumber(number: string): ValidationError | null {
    if (!number || typeof number !== "string") {
      return {
        code: "INVALID_FEATURE_NUMBER",
        message: "Invalid feature number. Feature numbers must be strings like '1', '2', '3'.",
      }
    }

    if (!/^\d+$/.test(number)) {
      return {
        code: "INVALID_FEATURE_NUMBER_FORMAT",
        message: `Invalid feature number "${number}". Feature numbers must be simple integers as strings (e.g., '1', '2', '3').`,
      }
    }

    return null
  }

  static validateActionNumber(number: string): ValidationError | null {
    if (!number || typeof number !== "string") {
      return {
        code: "INVALID_ACTION_NUMBER",
        message: "Invalid action number. Action numbers must be strings like '1.01', '1.02', '2.01'.",
      }
    }

    if (!/^\d+\.\d{2}$/.test(number)) {
      return {
        code: "INVALID_ACTION_NUMBER_FORMAT",
        message: `Invalid action number "${number}". Action numbers must follow the format 'X.YY' where X is the feature number and YY is a two-digit action number (e.g., '1.01', '1.02', '2.01').`,
      }
    }

    return null
  }

  static validateActionSequence(
    actions: Array<{ number: string }>, 
    globalSeenNumbers?: Set<string>,
    featureNumber?: string
  ): ValidationError[] {
    const errors: ValidationError[] = []
    const seenNumbers = new Set<string>()

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i]
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
            message: `Action number "${action.number}" does not match feature number "${featureNumber}". Action numbers must start with their feature number (e.g., action "${featureNumber}.01" for feature "${featureNumber}").`,
          })
        }
      }

      // Check for duplicates within this feature
      if (seenNumbers.has(action.number)) {
        errors.push({
          code: "DUPLICATE_ACTION_NUMBER",
          message: `Duplicate action number "${action.number}". Each action number must be unique within the roadmap.`,
        })
      }

      // Check for global duplicates
      if (globalSeenNumbers?.has(action.number)) {
        errors.push({
          code: "DUPLICATE_ACTION_NUMBER_GLOBAL",
          message: `Action number "${action.number}" already exists in another feature. Each action number must be unique across all features.`,
        })
      }

      seenNumbers.add(action.number)
      globalSeenNumbers?.add(action.number)
    }

    return errors
  }

  static validateFeatureSequence(
    features: Array<{ number: string; actions: Array<{ number: string }> }>,
  ): ValidationError[] {
    const errors: ValidationError[] = []
    const seenNumbers = new Set<string>()
    const seenActionNumbers = new Set<string>()

    for (let i = 0; i < features.length; i++) {
      const feature = features[i]
      const numberError = this.validateFeatureNumber(feature.number)

      if (numberError) {
        errors.push(numberError)
        continue
      }

      if (seenNumbers.has(feature.number)) {
        errors.push({
          code: "DUPLICATE_FEATURE_NUMBER",
          message: `Duplicate feature number "${feature.number}". Each feature number must be unique within the roadmap.`,
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
        message: `Invalid ${fieldType} title. Title must be a non-empty string.`,
      }
    }

    if (title.trim() === "") {
      return {
        code: "EMPTY_TITLE",
        message: `${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} title cannot be empty or just whitespace.`,
      }
    }

    return null
  }

  static validateDescription(description: string, fieldType: "feature" | "action"): ValidationError | null {
    if (!description || typeof description !== "string") {
      return {
        code: "INVALID_DESCRIPTION",
        message: `Invalid ${fieldType} description. Description must be a non-empty string.`,
      }
    }

    if (description.trim() === "") {
      return {
        code: "EMPTY_DESCRIPTION",
        message: `${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} description cannot be empty or just whitespace.`,
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
        message: `Invalid status transition from "${currentStatus}" to "${newStatus}". Valid transitions: ${allowedTransitions.map((s) => `"${currentStatus}" → "${s}"`).join(", ") || `No transitions allowed from "${currentStatus}"`}`,
      }
    }

    return null
  }
}
