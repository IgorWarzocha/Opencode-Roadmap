/**
 * Parses and renders the roadmap markdown document.
 * Keeps frontmatter simple and the task block machine-readable.
 * Exposes a narrow API for the storage layer.
 */
import type { Roadmap, RoadmapDocument } from "../types.js"
import { Roadmap as RoadmapSchema } from "../types.js"

const FRONTMATTER_START = "---\n"
const FRONTMATTER_END = "\n---\n"
const TASK_FENCE = "```json"
const TASK_FENCE_END = "\n```"

export const parseDocument = (data: string): RoadmapDocument => {
  const { frontmatter, body } = splitFrontmatter(data)
  const { feature, spec } = parseFrontmatter(frontmatter)
  const roadmap = parseRoadmapBody(body)

  return { feature, spec, roadmap }
}

export const buildDocument = (document: RoadmapDocument): string => {
  const specValue = document.spec.trimEnd()
  const specLines = specValue === "" ? [""] : specValue.split("\n")
  const specBlock = specLines.map((line) => `  ${line}`).join("\n")
  const tasks = JSON.stringify(document.roadmap, null, 2)

  return [
    "---",
    `feature: ${JSON.stringify(document.feature)}`,
    "spec: |",
    specBlock,
    "---",
    "",
    TASK_FENCE,
    tasks,
    "```",
    "",
  ].join("\n")
}

const splitFrontmatter = (data: string): { frontmatter: string; body: string } => {
  if (!data.startsWith(FRONTMATTER_START)) {
    throw new Error("Roadmap format is invalid. Missing frontmatter.")
  }

  const endIndex = data.indexOf(FRONTMATTER_END, FRONTMATTER_START.length)
  if (endIndex === -1) {
    throw new Error("Roadmap format is invalid. Frontmatter is not closed.")
  }

  const frontmatter = data.slice(FRONTMATTER_START.length, endIndex)
  const body = data.slice(endIndex + FRONTMATTER_END.length)

  return { frontmatter, body }
}

const parseFrontmatter = (frontmatter: string): { feature: string; spec: string } => {
  const lines = frontmatter.split("\n")
  let feature: string | null = null
  let specStart = -1

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (line.startsWith("feature:")) {
      feature = parseScalar(line.slice("feature:".length))
    }
    if (line.startsWith("spec:")) {
      if (line.trim() !== "spec: |") {
        throw new Error("Roadmap format is invalid. Spec must use a block value.")
      }
      specStart = i
    }
  }

  if (!feature) {
    throw new Error("Roadmap format is invalid. Missing feature.")
  }

  if (specStart === -1) {
    throw new Error("Roadmap format is invalid. Missing spec.")
  }

  const specLines = lines.slice(specStart + 1)
  const spec = normalizeSpec(specLines)

  return { feature, spec }
}

const parseScalar = (value: string): string => {
  const trimmed = value.trim()
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1)
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

const normalizeSpec = (lines: string[]): string => {
  if (lines.length === 0) {
    return ""
  }

  const nonEmpty = lines.filter((line) => line.trim() !== "")
  const indent =
    nonEmpty.length === 0
      ? 0
      : nonEmpty.reduce((min, line) => {
          const match = line.match(/^\s+/)
          const count = match ? match[0].length : 0
          return Math.min(min, count)
        }, Number.MAX_SAFE_INTEGER)

  const normalized = lines.map((line) => line.slice(indent))
  return normalized.join("\n").trimEnd()
}

const parseRoadmapBody = (body: string): Roadmap => {
  const fenceStart = body.indexOf(TASK_FENCE)
  if (fenceStart === -1) {
    throw new Error("Roadmap format is invalid. Missing task block.")
  }

  const jsonStart = body.indexOf("\n", fenceStart + TASK_FENCE.length)
  if (jsonStart === -1) {
    throw new Error("Roadmap format is invalid. Task block is incomplete.")
  }

  const fenceEnd = body.indexOf(TASK_FENCE_END, jsonStart + 1)
  if (fenceEnd === -1) {
    throw new Error("Roadmap format is invalid. Task block is not closed.")
  }

  const jsonText = body.slice(jsonStart + 1, fenceEnd).trim()
  const parsed: unknown = JSON.parse(jsonText)
  return RoadmapSchema.parse(parsed)
}

export const ensureDocument = (document: RoadmapDocument): RoadmapDocument => {
  const validated = RoadmapSchema.parse(document.roadmap)
  return {
    feature: document.feature,
    spec: document.spec,
    roadmap: validated,
  }
}
