/**
 * types.ts
 * Defines shared plugin context types for tool and hook modules.
 * Keeps runtime signatures consistent without using any.
 */
import type { PluginInput } from "@opencode-ai/plugin"

export type Ctx = {
  directory: string
  $: PluginInput["$"]
}
