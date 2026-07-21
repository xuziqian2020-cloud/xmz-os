import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"
import { resolveLocalStoragePath, saveLocalFallbackFile } from "./local-storage"
import { uploadToStorageBucket } from "./upload"

describe("file upload", () => {
  it("returns a normal upload error when Supabase Storage fetch throws", async () => {
    const bucket = {
      async upload() {
        throw new TypeError("fetch failed")
      },
    }
    const file = new File(["content"], "_scan_entities_A_M.md", { type: "text/markdown" })

    const result = await uploadToStorageBucket(bucket, "user/_scan_entities_A_M.md", file)

    assert.equal(result.error?.message, "fetch failed")
  })

  it("saves oversized database fallback files to a safe local path", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "xmz-files-"))
    try {
      const file = new File(["# Header"], "_scan_entities_A_M.md", { type: "text/markdown" })

      const storagePath = await saveLocalFallbackFile(rootDir, "user-1", "../folder/_scan_entities_A_M.md", file)
      const localPath = resolveLocalStoragePath(rootDir, storagePath)

      assert.match(storagePath, /^local:user-1\//)
      assert.ok(localPath)
      assert.equal(await readFile(localPath!, "utf8"), "# Header")
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it("rejects local storage paths that escape the local files root", () => {
    const localPath = resolveLocalStoragePath("C:/safe/root", "local:../outside.md")

    assert.equal(localPath, null)
  })

  it("uses local storage when database fallback would be too large", () => {
    const routeSource = readFileSync(new URL("../../app/api/files/upload/route.ts", import.meta.url), "utf8")

    assert.match(routeSource, /saveLocalFallbackFile/)
    assert.match(routeSource, /MAX_DATABASE_FALLBACK_DATA_URL_BYTES/)
  })
})
