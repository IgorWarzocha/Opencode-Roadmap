import { promises as fs } from "fs"
import { join } from "path"

export async function loadDescription(filename: string): Promise<string> {
  const filePath = join(__dirname, filename)
  return await fs.readFile(filePath, "utf-8")
}
