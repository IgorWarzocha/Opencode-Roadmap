/**
 * tools/shared.ts
 * Holds spec block parsing and merge helpers shared by plan tools.
 * Keeps append and read logic consistent across tool implementations.
 */
import { basename, join } from "path"

const startToken = "<!-- SPECS_START -->"
const endToken = "<!-- SPECS_END -->"

const parseSpecLines = (block: string) =>
  block
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.replace(/^- /, "").trim())
    .filter(Boolean)

const findSpecBlock = (content: string) => {
  const startIndex = content.indexOf(startToken)
  const endIndex = content.indexOf(endToken, startIndex + startToken.length)
  const hasStart = startIndex !== -1
  const hasEnd = endIndex !== -1 && endIndex > startIndex

  if (!hasStart) return null

  if (hasEnd) {
    const before = content.slice(0, startIndex + startToken.length)
    const middle = content.slice(startIndex + startToken.length, endIndex)
    const after = content.slice(endIndex)
    return { before, middle, after }
  }

  const afterStart = content.slice(startIndex + startToken.length)
  const headingMatch = afterStart.match(/\n##\s/)
  const headingIndex = headingMatch?.index ?? -1
  const recoverIndex = headingIndex >= 0 ? startIndex + startToken.length + headingIndex : content.length
  const before = content.slice(0, startIndex + startToken.length)
  const middle = content.slice(startIndex + startToken.length, recoverIndex)
  const after = content.slice(recoverIndex)
  return { before, middle, after }
}

const stripExtraEndTokens = (after: string) => {
  if (!after.startsWith(endToken)) return after
  const tail = after.slice(endToken.length)
  const escaped = endToken.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const trimmed = tail.replace(new RegExp(`^(?:${escaped})+`), "")
  return endToken + trimmed
}

const writeWithMerge = async (path: string, spec: string) => {
  const attempts = 5
  for (const _ of Array.from({ length: attempts })) {
    const current = await Bun.file(path).text()
    const block = findSpecBlock(current)
    if (!block) return { ok: false, reason: "missing spec block" }

    const existing = parseSpecLines(block.middle)
    if (existing.includes(spec)) return { ok: true }

    const merged = [...existing, spec]
    const newMiddle = merged.map((name) => `- ${name}`).join("\n")
    const normalizedAfter = stripExtraEndTokens(block.after)
    const tail = normalizedAfter.startsWith(endToken) ? normalizedAfter.slice(endToken.length) : normalizedAfter
    const next = `${block.before}\n${newMiddle}\n${endToken}${tail}`

    const bytes = await Bun.write(path, next)
    if (bytes === 0) return { ok: false, reason: "write failed" }

    const verify = await Bun.file(path).text()
    const verifyBlock = findSpecBlock(verify)
    if (!verifyBlock) return { ok: false, reason: "missing spec block" }
    const verifySpecs = parseSpecLines(verifyBlock.middle)
    if (verifySpecs.includes(spec)) return { ok: true }
  }

  return { ok: false, reason: "concurrent updates" }
}

const listRepoSpecs = async (directory: string) => {
  const glob = new Bun.Glob(join(directory, "docs/specs/*.md"))
  const files = await Array.fromAsync(glob.scan())
  const repoSpecs: string[] = []
  for (const file of files) {
    const text = await Bun.file(file).text()
    const head = text.split("\n").slice(0, 8).join("\n")
    if (!/^Scope:\s*repo\b/m.test(head)) continue
    repoSpecs.push(`/docs/specs/${basename(file)}`)
  }
  return repoSpecs
}

export { endToken, findSpecBlock, listRepoSpecs, parseSpecLines, startToken, writeWithMerge }
