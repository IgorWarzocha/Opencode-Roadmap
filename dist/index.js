import { createCreateRoadmapTool } from "./tools/createroadmap";
import { createUpdateRoadmapTool } from "./tools/updateroadmap";
import { createReadRoadmapTool } from "./tools/readroadmap";
export const RoadmapPlugin = async ({ project, directory, worktree, $ }) => {
    return {
        tool: {
            createroadmap: await createCreateRoadmapTool(directory),
            updateroadmap: await createUpdateRoadmapTool(directory),
            readroadmap: await createReadRoadmapTool(directory),
        },
    };
};
export default RoadmapPlugin;
