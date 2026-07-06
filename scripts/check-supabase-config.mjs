import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import ts from "typescript"

const root = process.cwd()
const modulePath = path.join(root, "src", "lib", "supabase", "config.ts")

function loadConfigModule() {
  const source = fs.readFileSync(modulePath, "utf8")
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText

  const moduleExports = {}
  const sandbox = {
    exports: moduleExports,
    module: { exports: moduleExports },
    process: { env: { ...process.env } },
    URL,
  }

  vm.runInNewContext(compiled, sandbox, { filename: modulePath })
  return sandbox.module.exports
}

function withEnv(url, key, fn) {
  const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const oldKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (url === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_URL = url
  }

  if (key === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = key
  }

  try {
    fn()
  } finally {
    if (oldUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = oldUrl
    }

    if (oldKey === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = oldKey
    }
  }
}

withEnv("https://placeholder.supabase.co", "placeholder-key", () => {
  const config = loadConfigModule()
  assert.equal(config.isDemoMode(), true)
  assert.equal(config.isSupabaseReady(), false)
})

withEnv("https://demo.supabase.co", "eyJ-real-looking-anon-key", () => {
  const config = loadConfigModule()
  assert.equal(config.isDemoMode(), false)
  assert.equal(config.isSupabaseReady(), true)
})

withEnv(undefined, undefined, () => {
  const config = loadConfigModule()
  assert.equal(config.isDemoMode(), true)
  assert.equal(config.isSupabaseReady(), false)
})

console.log("supabase config checks passed")
