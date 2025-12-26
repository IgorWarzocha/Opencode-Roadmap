/**
 * Centralizes file naming for the roadmap document.
 * Keeps path logic consistent across storage helpers.
 */
import { join } from "path"

export const ROADMAP_DIR = "roadmap"
export const ROADMAP_FILE = "roadmap.md"
export const LOCK_FILE = `${ROADMAP_FILE}.lock`

export const roadmapDir = (base: string): string => join(base, ROADMAP_DIR)
export const roadmapPath = (base: string): string => join(roadmapDir(base), ROADMAP_FILE)
export const lockPath = (base: string): string => join(roadmapDir(base), LOCK_FILE)

export const tempPath = (base: string, suffix: string): string =>
  join(roadmapDir(base), `${ROADMAP_FILE}.tmp.${suffix}`)
