/**
 * utils.ts
 * Provides path safety, directory creation, and file formatting helpers for plans and specs.
 * Centralizes plan frontmatter normalization to keep files consistent.
 */
import type { PluginInput } from "@opencode-ai/plugin"
import { resolve, join, normalize } from "path"

type BunShell = PluginInput["$"]

const namePattern = /^[A-Za-z0-9-]+$/

export const validateName = (name: string) => {
  if (!name || typeof name !== "string") return { ok: false, reason: "name is required" }
  if (!namePattern.test(name)) return { ok: false, reason: "use only letters, numbers, and hyphens" }
  const parts = name.split("-").filter(Boolean)
  if (parts.length === 0) return { ok: false, reason: "name cannot be empty" }
  if (parts.length > 3) return { ok: false, reason: "use max 3 hyphen-separated words" }
  return { ok: true }
}

export const sanitizeFilename = (name: string) => {
  if (!name || typeof name !== "string") return "untitled"
  const sanitized = name
    .replace(/[\0-\x1f\x7f]/g, "")
    .replace(/[\\/:\*\?"<>\|]/g, "_")
    .trim()
  return sanitized.length === 0 ? "untitled" : sanitized
}

export const getSecurePath = (baseDir: string, name: string) => {
  const sanitized = sanitizeFilename(name)
  const fullBase = resolve(baseDir)
  const target = resolve(join(fullBase, `${sanitized}.md`))

  if (!target.startsWith(fullBase)) {
    throw new Error(`Security violation: Path ${target} is outside of ${fullBase}`)
  }
  return target
}

export const getPlanPath = (directory: string, name: string) => getSecurePath(join(directory, "docs/plans"), name)

export const getSpecPath = (directory: string, name: string) => getSecurePath(join(directory, "docs/specs"), name)

export const listPlans = async (directory: string) => {
  const glob = new Bun.Glob(join(directory, "docs/plans/*.md"))
  return Array.fromAsync(glob.scan())
}

export async function ensureDirectory(path: string, $: BunShell) {
  const dir = normalize(join(path, ".."))
  await $`mkdir -p ${dir}`
}

export const formatPlan = (idea: string, name: string, description: string, implementation: string[]) => {
  const implementationSection =
    implementation.length > 0 ? `\n## Implementation\n${implementation.map((item) => `- ${item}`).join("\n")}\n` : ""

  return `
---
plan name: ${name}
plan description: ${description}
plan status: active
---

## Idea
${idea}
${implementationSection}
## Required Specs
<!-- SPECS_START -->
<!-- SPECS_END -->
`.trim()
}

export const normalizePlanFrontmatter = (content: string, name: string, description: string, status: string) => {
  const header = `---\nplan name: ${name}\nplan description: ${description}\nplan status: ${status}\n---\n\n`
  const rest = content.replace(/^---[\s\S]*?---\n\n?/, "")
  return header + rest
}

export const formatSpec = (name: string, scope: string, content: string) =>
  `
# Spec: ${name}

Scope: ${scope}

${content}
`.trim()
