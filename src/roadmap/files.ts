/**
 * Handles roadmap file IO with atomic writes.
 * Keeps filesystem concerns separate from document parsing.
 */
import { promises as fs } from "fs"
import { roadmapDir, roadmapPath, tempPath } from "./paths.js"

export const ensureRoadmapDir = async (base: string): Promise<void> => {
  await fs.mkdir(roadmapDir(base), { recursive: true }).catch(() => {})
}

export const readRoadmapFile = async (base: string): Promise<string> => {
  return await fs.readFile(roadmapPath(base), "utf-8")
}

const fsyncDir = async (dir: string): Promise<void> => {
  const handle = await fs.open(dir, "r")
  try {
    await handle.sync()
  } finally {
    await handle.close().catch(() => {})
  }
}

export const writeRoadmapFile = async (base: string, data: string): Promise<void> => {
  const suffix = `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`
  const temp = tempPath(base, suffix)
  const handle = await fs.open(temp, "w")

  try {
    await handle.writeFile(data, "utf-8")
    await handle.sync()
    await handle.close()
    await fs.rename(temp, roadmapPath(base))
    await fsyncDir(roadmapDir(base))
  } catch (error: unknown) {
    await handle.close().catch(() => {})
    await fs.unlink(temp).catch(() => {})
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Unknown error while persisting roadmap")
  }
}

export const archiveRoadmapFile = async (base: string): Promise<string> => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const archiveFilename = `roadmap.archive.${timestamp}.md`
  const archivePath = `${roadmapDir(base)}/${archiveFilename}`

  await fs.rename(roadmapPath(base), archivePath)
  await fsyncDir(roadmapDir(base))
  return archiveFilename
}
