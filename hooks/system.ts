/**
 * hooks/system.ts
 * Injects available plan names and descriptions into the system prompt.
 * Keeps the prompt in sync with current plan files.
 */
import { basename } from "path"
import { listPlans } from "../utils"
import type { Ctx } from "../types"

const formatAvailablePlans = (plans: { name: string; description: string }[]) => {
  if (plans.length === 0) return "<available_plans></available_plans>"
  return `<available_plans>${plans
    .map((plan) => `<plan><name>${plan.name}</name><description>${plan.description}</description></plan>`)
    .join("")}</available_plans>`
}

const stripExtension = (name: string) => (name.endsWith(".md") ? name.slice(0, -3) : name)

const extractDescription = (text: string) => {
  const head = text.split("\n").slice(0, 8).join("\n")
  const match = head.match(/^plan description:\s*(.+)$/m)
  return match?.[1]?.trim() || ""
}

export const systemHooks = (ctx: Ctx) => ({
  "experimental.chat.system.transform": async (_input: { sessionID: string }, output: { system: string[] }) => {
    const files = await listPlans(ctx.directory)
    const plans = await Promise.all(
      files.map(async (file) => ({
        name: stripExtension(basename(file)),
        description: extractDescription(await Bun.file(file).text()),
      })),
    )
    output.system.push(formatAvailablePlans(plans))
  },
})
