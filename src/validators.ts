/**
 * Validates roadmap identifiers and text fields.
 * Keeps validation concerns separate from storage and tools.
 */
import type { ValidationError } from "./types.js"

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
    featureNumber?: string,
  ): ValidationError[] {
    const errors: ValidationError[] = []
    const seenNumbers = new Set<string>()

    for (const action of actions) {
      const numberError = this.validateActionNumber(action.number)

      if (numberError) {
        errors.push(numberError)
        continue
      }

      if (featureNumber) {
        const actionFeaturePrefix = action.number.split(".")[0]
        if (actionFeaturePrefix !== featureNumber) {
          errors.push({
            code: "ACTION_FEATURE_MISMATCH",
            message: `Action "${action.number}" does not belong to feature "${featureNumber}".`,
          })
        }
      }

      if (seenNumbers.has(action.number)) {
        errors.push({
          code: "DUPLICATE_ACTION_NUMBER",
          message: `Duplicate action ID "${action.number}".`,
        })
      }

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

  static validateFeatureSequence(features: { number: string; actions: { number: string }[] }[]): ValidationError[] {
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
    const validStatuses = ["pending", "in_progress", "completed", "cancelled"]

    if (!validStatuses.includes(newStatus)) {
      return {
        code: "INVALID_STATUS",
        message: `Invalid status "${newStatus}". Valid: ${validStatuses.join(", ")}`,
      }
    }

    if (currentStatus === "cancelled") {
      return {
        code: "INVALID_STATUS_TRANSITION",
        message: "Cannot change status of cancelled action. Create a new action instead.",
      }
    }

    return null
  }
}
