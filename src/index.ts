import type { Plugin } from "@opencode-ai/plugin"
import { createCreateRoadmapTool } from "./tools/createroadmap.js"
import { createUpdateRoadmapTool } from "./tools/updateroadmap.js"
import { createReadRoadmapTool } from "./tools/readroadmap.js"

export const RoadmapPlugin: Plugin = async ({ directory }) => {
  return {
    tool: {
      createroadmap: await createCreateRoadmapTool(directory),
      updateroadmap: await createUpdateRoadmapTool(directory),
      readroadmap: await createReadRoadmapTool(directory),
    },
  }
}

export default RoadmapPlugin
