import { readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { spawnSync } from "node:child_process"

function collectTests(dir, files) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const info = statSync(fullPath)

    if (info.isDirectory()) {
      collectTests(fullPath, files)
      continue
    }

    if (entry.endsWith(".test.ts")) {
      files.push(fullPath)
    }
  }
}

const explicitFiles = process.argv.slice(2)
const testFiles = explicitFiles.length > 0 ? explicitFiles : []

if (testFiles.length === 0) {
  collectTests("src", testFiles)
}

if (testFiles.length === 0) {
  console.error("No test files found.")
  process.exit(1)
}

const result = spawnSync(process.execPath, ["--import", "tsx", "--test", ...testFiles], {
  stdio: "inherit",
  shell: false,
})

process.exit(result.status ?? 1)
