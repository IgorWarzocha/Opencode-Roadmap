export * from "./gen/types.gen.js";
import { createClient } from "./gen/client/client.gen.js";
import { OpencodeClient } from "./gen/sdk.gen.js";
export { OpencodeClient };
export function createOpencodeClient(config) {
    if (!config?.fetch) {
        const customFetch = (req) => {
            // @ts-ignore
            req.timeout = false;
            return fetch(req);
        };
        config = {
            ...config,
            fetch: customFetch,
        };
    }
    if (config?.directory) {
        const isNonASCII = /[^\x00-\x7F]/.test(config.directory);
        const encodedDirectory = isNonASCII ? encodeURIComponent(config.directory) : config.directory;
        config.headers = {
            ...config.headers,
            "x-opencode-directory": encodedDirectory,
        };
    }
    const client = createClient(config);
    return new OpencodeClient({ client });
}
