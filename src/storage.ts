/**
 * Persists the roadmap document with locking and atomic writes.
 * Delegates parsing and formatting to the document helpers.
 * Keeps IO logic focused on concurrency and filesystem safety.
 */
import { promises as fs } from "fs"
import { z } from "zod"
import type { RoadmapDocument, RoadmapStorage } from "./types.js"
import { parseDocument, buildDocument, ensureDocument } from "./roadmap/document.js"
import { acquireLock } from "./roadmap/lock.js"
import { ensureRoadmapDir, readRoadmapFile, writeRoadmapFile, archiveRoadmapFile } from "./roadmap/files.js"
import { roadmapPath } from "./roadmap/paths.js"

type UpdateResult<T> = {
  document: RoadmapDocument
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
      await fs.access(roadmapPath(this.directory))
      return true
    } catch {
      return false
    }
  }

  async read(): Promise<RoadmapDocument | null> {
    return this.readFromDisk()
  }

  async write(document: RoadmapDocument): Promise<void> {
    await ensureRoadmapDir(this.directory)

    const unlock = await acquireLock(this.directory)
    try {
      const data = buildDocument(ensureDocument(document))
      await writeRoadmapFile(this.directory, data)
    } finally {
      await unlock()
    }
  }

  async update<T>(fn: (current: RoadmapDocument | null) => Promise<UpdateResult<T>> | UpdateResult<T>): Promise<T> {
    await ensureRoadmapDir(this.directory)

    const unlock = await acquireLock(this.directory)
    try {
      const current = await this.readFromDisk()
      const outcome = await fn(current)
      const data = buildDocument(ensureDocument(outcome.document))
      await writeRoadmapFile(this.directory, data)

      const archiveName = outcome.archive ? await archiveRoadmapFile(this.directory) : null
      return outcome.buildResult(archiveName)
    } finally {
      await unlock()
    }
  }

  async archive(): Promise<string> {
    if (!(await this.exists())) {
      throw new Error("Roadmap not found.")
    }

    const unlock = await acquireLock(this.directory)
    try {
      return await archiveRoadmapFile(this.directory)
    } finally {
      await unlock()
    }
  }

  private async readFromDisk(): Promise<RoadmapDocument | null> {
    try {
      const data = await readRoadmapFile(this.directory)
      if (!data.trim()) {
        return null
      }
      return ensureDocument(parseDocument(data))
    } catch (error: unknown) {
      if (error instanceof SyntaxError) {
        throw new Error("Roadmap data is invalid. Unable to parse tasks.")
      }
      if (error instanceof z.ZodError) {
        const issues = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
        throw new Error(`Roadmap data is invalid: ${issues}`)
      }
      if (error instanceof Error && error.message.includes("ENOENT")) {
        return null
      }
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Unknown error while loading roadmap")
    }
  }
}
