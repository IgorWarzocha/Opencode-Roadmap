import { z } from "zod";
export type ToolContext = {
    sessionID: string;
    messageID: string;
    agent: string;
    abort: AbortSignal;
};
export declare function tool<Args extends z.ZodRawShape>(input: {
    description: string;
    args: Args;
    execute(args: z.infer<z.ZodObject<Args>>, context: ToolContext): Promise<string>;
}): {
    description: string;
    args: Args;
    execute(args: z.infer<z.ZodObject<Args>>, context: ToolContext): Promise<string>;
};
export declare namespace tool {
    var schema: typeof z;
}
export type ToolDefinition = ReturnType<typeof tool>;
