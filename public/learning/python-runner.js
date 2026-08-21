let pyodidePromise

const blockedPatterns = [
  /\bimport\s+(?:js|socket|requests|urllib|httpx|webbrowser|subprocess|micropip)\b/i,
  /\bfrom\s+(?:js|socket|requests|urllib|httpx|webbrowser|subprocess|micropip)\b/i,
  /^\s*(?:from|import)\s+/m,
  /\b(?:open|input|__import__)\s*\(/i,
  /\b(?:pyfetch|fetch)\s*\(/i,
  /\b(?:os\.system|system)\s*\(/i,
]

async function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      const indexURL = "/learning/pyodide/"
      importScripts(`${indexURL}pyodide.js`)
      return loadPyodide({ indexURL })
    })()
  }
  return pyodidePromise
}

self.onmessage = async (event) => {
  const code = String(event.data?.code || "")
  const isBlocked = blockedPatterns.some((pattern) => pattern.test(code))

  if (isBlocked) {
    self.postMessage({ ok: false, output: "本练习只允许基础 Python。网络、文件和安装第三方包操作请在 PyCharm 本地项目中完成。" })
    return
  }

  try {
    const pyodide = await getPyodide()
    self.postMessage({ type: "ready" })
    const lines = []
    pyodide.setStdout({ batched: (text) => lines.push(text) })
    pyodide.setStderr({ batched: (text) => lines.push(text) })
    await pyodide.runPythonAsync(`
import builtins
def _learning_blocked(*args, **kwargs):
    raise PermissionError("浏览器练习不允许访问文件或网络")
builtins.open = _learning_blocked
builtins.__import__ = _learning_blocked
builtins.input = _learning_blocked
${code}
`)
    self.postMessage({ ok: true, output: lines.join("\n") || "代码已运行，没有输出。" })
  } catch (error) {
    self.postMessage({ ok: false, output: String(error?.message || error) })
  }
}
