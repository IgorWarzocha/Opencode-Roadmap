import { promises as fs } from "fs"
import { join } from "path"

export async function loadDescription(filename: string): Promise<string> {
  // Assets are colocated with the compiled loader (copied into dist/src/descriptions).
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
