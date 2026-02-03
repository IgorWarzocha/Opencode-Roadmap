/**
 * bundled.ts
 * Registers bundled skills that ship with this plugin package.
 * Resolves skill paths relative to the compiled entry point without writing files.
 */
import { access } from "fs/promises"
import path from "path"
import { fileURLToPath } from "node:url"

import type { Hooks } from "@opencode-ai/plugin"

type SkillsConfig = {
  skills?: {
    paths?: string[]
  }
  skill?: {
    paths?: string[]
  }
}

type Config = Parameters<NonNullable<Hooks["config"]>>[0] & SkillsConfig

const resolveBundledSkillPaths = async () => {
  const baseDir = path.dirname(fileURLToPath(import.meta.url))
  const candidates = [path.join(baseDir, "skills"), path.join(baseDir, "..", "skills")]
  const resolved: string[] = []

  for (const candidate of candidates) {
    try {
      await access(candidate)
      resolved.push(candidate)
    } catch {
      // Ignore missing paths
    }
  }

  return resolved
}

const registerSkillPaths = (config: Config, paths: string[]) => {
  if (paths.length === 0) return

  config.skills ??= {}
  config.skills.paths ??= []
  config.skill ??= {}
  config.skill.paths ??= []

  for (const skillPath of paths) {
    if (!config.skills.paths.includes(skillPath)) config.skills.paths.push(skillPath)
    if (!config.skill.paths.includes(skillPath)) config.skill.paths.push(skillPath)
  }
}

export const createBundledSkillsHook = (): Pick<Hooks, "config"> => {
  return {
    config: async (config) => {
      const paths = await resolveBundledSkillPaths()
      registerSkillPaths(config, paths)
    },
  }
}
