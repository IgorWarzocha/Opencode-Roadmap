import { promises as fs } from "fs"
import { join } from "path"

export async function loadDescription(filename: string): Promise<string> {
  // In the compiled output, __dirname is .../dist/descriptions, but the assets are in .../src/descriptions.
  // This path adjustment ensures the assets are found regardless of the build process.
  const descriptionsDir = join(__dirname, "..", "..", "src", "descriptions")
  const filePath = join(descriptionsDir, filename)
  try {
    return await fs.readFile(filePath, "utf-8")
  } catch (error: any) {
    if (error.code === "ENOENT") {
      throw new Error(
        `Description file not found: ${filename}. Looked in: ${filePath}. Please ensure asset files are correctly located.`,
      )
    }
    throw error
  }
}
