/**
 * Loads error message templates from the errors directory.
 * Supports template variable substitution for dynamic error messages.
 */
import { promises as fs } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ERROR_CACHE: Record<string, string> = {}

export async function loadErrorTemplate(filename: string): Promise<string> {
  if (ERROR_CACHE[filename]) return ERROR_CACHE[filename]

  const filePath = join(__dirname, `${filename}.txt`)

  try {
    const content = await fs.readFile(filePath, "utf-8")
    ERROR_CACHE[filename] = content.trim()
    return ERROR_CACHE[filename]
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException
    if (err?.code === "ENOENT") {
      throw new Error(`Error template not found: ${filename} at ${filePath}`)
    }
    throw err ?? new Error("Unknown error loading error template")
  }
}

export async function getErrorMessage(filename: string, params: Record<string, string> = {}): Promise<string> {
  const template = await loadErrorTemplate(filename)
  return template.replace(/\{(\w+)\}/g, (_, key) => params[key as string] || `{${key}}`)
}
