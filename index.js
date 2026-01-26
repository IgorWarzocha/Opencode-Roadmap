import { createTools } from "./tools";
import { systemHooks } from "./hooks";
export const PlanPlugin = async (ctx) => {
    return {
        tool: createTools(ctx),
        ...systemHooks(ctx),
    };
};
export default PlanPlugin;
