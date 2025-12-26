/**
 * File-based storage for roadmap data with atomic writes and validation.
 * Handles concurrent access via file locking and provides safe read/write operations.
 */
import { promises as fs } from "fs"
import type { Stats } from "fs"
import { join } from "path"
import { z } from "zod"
import type { Roadmap, RoadmapStorage, ValidationError } from "./types.js"
import { Roadmap as RoadmapSchema } from "./types.js"

const ROADMAP_FILE = "roadmap.json"
const LOCK_FILE = `${ROADMAP_FILE}.lock`
const LOCK_TIMEOUT_MS = 5000
const LOCK_RETRY_MS = 50
const LOCK_STALE_MS = 30000

type UpdateResult<T> = {
  roadmap: Roadmap
  buildResult: (archiveName: string | null) => T
  archive?: boolean
}

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
    return this.readFromDisk()
  }

  private async readFromDisk(): Promise<Roadmap | null> {
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
      if (error instanceof z.ZodError) {
        const issues = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
        throw new Error(`Roadmap file has invalid structure: ${issues}`)
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

  private async acquireLock(): Promise<() => Promise<void>> {
    const lockPath = join(this.directory, LOCK_FILE)
    const start = Date.now()

    while (Date.now() - start < LOCK_TIMEOUT_MS) {
      try {
        await fs.writeFile(lockPath, String(process.pid), { flag: "wx" })
        return async () => {
          await fs.unlink(lockPath).catch(() => {})
        }
      } catch {
        const isStale = await fs
          .stat(lockPath)
          .then((stat: Stats) => Date.now() - stat.mtimeMs > LOCK_STALE_MS)
          .catch(() => false)
        if (isStale) {
          await fs.unlink(lockPath).catch(() => {})
          continue
        }
        await new Promise((resolve) => setTimeout(resolve, LOCK_RETRY_MS))
      }
    }
    throw new Error("Could not acquire lock on roadmap file. Another operation may be in progress.")
  }

  private async fsyncDir(): Promise<void> {
    const handle = await fs.open(this.directory, "r")
    try {
      await handle.sync()
    } finally {
      await handle.close().catch(() => {})
    }
  }

  private async writeAtomic(filePath: string, data: string): Promise<void> {
    const randomSuffix = Math.random().toString(36).slice(2, 8)
    const tempPath = join(this.directory, `${ROADMAP_FILE}.tmp.${Date.now()}.${randomSuffix}`)
    const handle = await fs.open(tempPath, "w")

    try {
      await handle.writeFile(data, "utf-8")
      await handle.sync()
      await handle.close()
      await fs.rename(tempPath, filePath)
      await this.fsyncDir()
    } catch (error: unknown) {
      await handle.close().catch(() => {})
      await fs.unlink(tempPath).catch(() => {})
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Unknown error while writing roadmap")
    }
  }

  private async archiveUnlocked(): Promise<string> {
    const filePath = join(this.directory, ROADMAP_FILE)
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const archiveFilename = `roadmap.archive.${timestamp}.json`
    const archivePath = join(this.directory, archiveFilename)

    await fs.rename(filePath, archivePath)
    await this.fsyncDir()
    return archiveFilename
  }

  async write(roadmap: Roadmap): Promise<void> {
    await fs.mkdir(this.directory, { recursive: true }).catch(() => {})

    const unlock = await this.acquireLock()
    try {
      const data = JSON.stringify(roadmap, null, 2)
      const filePath = join(this.directory, ROADMAP_FILE)
      await this.writeAtomic(filePath, data)
    } finally {
      await unlock()
    }
  }

  async update<T>(fn: (current: Roadmap | null) => Promise<UpdateResult<T>> | UpdateResult<T>): Promise<T> {
    await fs.mkdir(this.directory, { recursive: true }).catch(() => {})

    const unlock = await this.acquireLock()
    try {
      const current = await this.readFromDisk()
      const outcome = await fn(current)
      const data = JSON.stringify(outcome.roadmap, null, 2)
      const filePath = join(this.directory, ROADMAP_FILE)
      await this.writeAtomic(filePath, data)

      const archiveName = outcome.archive ? await this.archiveUnlocked() : null
      return outcome.buildResult(archiveName)
    } finally {
      await unlock()
    }
  }

  async archive(): Promise<string> {
    if (!(await this.exists())) {
      throw new Error("Cannot archive: roadmap file does not exist")
    }

    const unlock = await this.acquireLock()
    try {
      return await this.archiveUnlocked()
    } finally {
      await unlock()
    }
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

      // Check action-feature mismatch
      if (featureNumber) {
        const actionFeaturePrefix = action.number.split(".")[0]
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

    // Allow any transition except from cancelled (terminal state for abandoned work)
    if (currentStatus === "cancelled") {
      return {
        code: "INVALID_STATUS_TRANSITION",
        message: "Cannot change status of cancelled action. Create a new action instead.",
      }
    }

    return null
  }
}
