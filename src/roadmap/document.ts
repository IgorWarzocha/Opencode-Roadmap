/**
 * Parses and renders the roadmap markdown document.
 * Keeps frontmatter simple and the task list machine-readable.
 * Exposes a narrow API for the storage layer.
 */
import type { ActionStatus, Roadmap, RoadmapDocument } from "../types.js"
import { Roadmap as RoadmapSchema } from "../types.js"

const FRONTMATTER_START = "---\n"
const FRONTMATTER_END = "\n---\n"
const TASK_LIST_HEADER = "## Task List"

const STATUS_MAP: Record<string, ActionStatus> = {
  " ": "pending",
  x: "completed",
  X: "completed",
  "~": "in_progress",
  "-": "cancelled",
}

export const parseDocument = (data: string): RoadmapDocument => {
  const { frontmatter, body } = splitFrontmatter(data)
  const { feature, spec } = parseFrontmatter(frontmatter)
  const roadmap = parseTaskList(body)

  return { feature, spec, roadmap }
}

export const buildDocument = (document: RoadmapDocument): string => {
  const specValue = document.spec.trimEnd()
  const specLines = specValue === "" ? [""] : specValue.split("\n")
  const specBlock = specLines.map((line) => `  ${line}`).join("\n")
  const taskList = buildTaskList(document.roadmap)

  return [
    "---",
    `feature: ${JSON.stringify(document.feature)}`,
    "spec: |",
    specBlock,
    "---",
    "",
    TASK_LIST_HEADER,
    "",
    taskList,
  ].join("\n")
}

export const ensureDocument = (document: RoadmapDocument): RoadmapDocument => {
  const validated = RoadmapSchema.parse(document.roadmap)
  return {
    feature: document.feature,
    spec: document.spec,
    roadmap: validated,
  }
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

const parseTaskList = (body: string): Roadmap => {
  const lines = body.split("\n")
  const features: Roadmap["features"] = []
  let currentFeature: Roadmap["features"][number] | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === "" || trimmed === TASK_LIST_HEADER) {
      continue
    }

    const featureMatch = trimmed.match(/^#+\s*Feature\s+(\d+)\s*:\s*(.+)$/)
    if (featureMatch) {
      if (currentFeature) {
        features.push(currentFeature)
      }
      currentFeature = {
        number: featureMatch[1],
        title: featureMatch[2].trim(),
        description: "",
        actions: [],
      }
      continue
    }

    const descriptionMatch = trimmed.match(/^Description:\s*(.+)$/)
    if (descriptionMatch) {
      if (!currentFeature) {
        throw new Error("Roadmap format is invalid. Description must follow a feature header.")
      }
      currentFeature.description = descriptionMatch[1].trim()
      continue
    }

    const actionMatch = trimmed.match(/^-\s*\[([ xX~-])\]\s+(\d+\.\d{2})\s+(.+)$/)
    if (actionMatch) {
      if (!currentFeature) {
        throw new Error("Roadmap format is invalid. Action must follow a feature header.")
      }
      const statusToken = actionMatch[1]
      const status = STATUS_MAP[statusToken]
      if (!status) {
        throw new Error("Roadmap format is invalid. Unsupported status marker.")
      }
      const number = actionMatch[2]
      const numberPrefix = number.split(".")[0]
      if (numberPrefix !== currentFeature.number) {
        throw new Error(`Action "${number}" does not belong to feature "${currentFeature.number}".`)
      }
      currentFeature.actions.push({
        number,
        description: actionMatch[3].trim(),
        status,
      })
      continue
    }
  }

  if (currentFeature) {
    features.push(currentFeature)
  }

  if (features.length === 0) {
    throw new Error("Roadmap format is invalid. Missing task list.")
  }

  for (const feature of features) {
    if (!feature.description) {
      throw new Error(`Feature "${feature.number}" is missing a description.`)
    }
    if (feature.actions.length === 0) {
      throw new Error(`Feature "${feature.number}" must include at least one action.`)
    }
  }

  return RoadmapSchema.parse({ features })
}

const buildTaskList = (roadmap: Roadmap): string => {
  const lines: string[] = []

  for (const feature of roadmap.features) {
    lines.push(`### Feature ${feature.number}: ${feature.title}`)
    lines.push(`Description: ${feature.description}`)
    for (const action of feature.actions) {
      lines.push(`${renderAction(action.status)} ${action.number} ${action.description}`)
    }
    lines.push("")
  }

  return lines.join("\n")
}

const renderAction = (status: ActionStatus): string => {
  switch (status) {
    case "completed":
      return "- [x]"
    case "in_progress":
      return "- [~]"
    case "cancelled":
      return "- [-]"
    case "pending":
    default:
      return "- [ ]"
  }
}
