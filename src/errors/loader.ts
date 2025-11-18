import { promises as fs } from "fs"
import { join } from "path"

const ERROR_CACHE: Record<string, string> = {}

export async function loadErrorTemplate(filename: string): Promise<string> {
  if (ERROR_CACHE[filename]) return ERROR_CACHE[filename]

  const errorsDir = join(__dirname, "..", "..", "src", "errors")
  const filePath = join(errorsDir, filename + ".txt")
  
  try {
    const content = await fs.readFile(filePath, "utf-8")
    ERROR_CACHE[filename] = content.trim()
    return ERROR_CACHE[filename]
  } catch (error: any) {
    if (error.code === "ENOENT") {
        throw new Error(`Error template not found: ${filename} at ${filePath}`)
    }
    throw error
  }
}

export async function getErrorMessage(filename: string, params: Record<string, string> = {}): Promise<string> {
    const template = await loadErrorTemplate(filename)
    return template.replace(/\{(\w+)\}/g, (_, key) => params[key] || `{${key}}`)
}