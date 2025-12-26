/**
 * Loads tool description text files from the descriptions directory.
 * ESM-compatible using import.meta.url for path resolution.
 */
import { promises as fs } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export async function loadDescription(filename: string): Promise<string> {
  const filePath = join(__dirname, filename)
  try {
    return await fs.readFile(filePath, "utf-8")
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException
    if (err?.code === "ENOENT") {
      throw new Error(
        `Description file not found: ${filename}. Looked in: ${filePath}. Please ensure asset files are correctly located.`,
      )
    }
    throw err ?? new Error("Unknown error while loading description")
  }
}
