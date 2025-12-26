/**
 * Provides exclusive access for roadmap operations.
 * Uses a lock file with stale detection to avoid deadlocks.
 */
import { promises as fs } from "fs"
import type { Stats } from "fs"
import { lockPath } from "./paths.js"

const LOCK_TIMEOUT_MS = 5000
const LOCK_RETRY_MS = 50
const LOCK_STALE_MS = 30000

export const acquireLock = async (base: string): Promise<() => Promise<void>> => {
  const path = lockPath(base)
  const start = Date.now()

  while (Date.now() - start < LOCK_TIMEOUT_MS) {
    try {
      await fs.writeFile(path, String(process.pid), { flag: "wx" })
      return async () => {
        await fs.unlink(path).catch(() => {})
      }
    } catch {
      const isStale = await fs
        .stat(path)
        .then((stat: Stats) => Date.now() - stat.mtimeMs > LOCK_STALE_MS)
        .catch(() => false)
      if (isStale) {
        await fs.unlink(path).catch(() => {})
        continue
      }
      await new Promise((resolve) => setTimeout(resolve, LOCK_RETRY_MS))
    }
  }

  throw new Error("Could not acquire lock on roadmap data. Another operation may be in progress.")
}
