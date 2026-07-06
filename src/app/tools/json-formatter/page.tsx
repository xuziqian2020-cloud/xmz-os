"use client"
import { useState } from "react"

export default function JsonFormatterPage() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")

  const format = () => {
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed, null, 2))
      setError("")
    } catch (e: any) {
      setError(e.message)
      setOutput("")
    }
  }

  const minify = () => {
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed))
      setError("")
    } catch (e: any) {
      setError(e.message)
      setOutput("")
    }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-lg font-semibold">JSON 格式化</h1><p className="mt-1 text-sm text-muted-foreground">格式化、校验和压缩 JSON 数据</p></div>
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="粘贴 JSON 数据..." rows={10} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:border-primary/30 resize-y" />
      <div className="flex gap-3">
        <button onClick={format} disabled={!input.trim()} className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40">格式化</button>
        <button onClick={minify} disabled={!input.trim()} className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">压缩</button>
      </div>
      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
      {output && <pre className="overflow-x-auto rounded-lg border border-border bg-card p-4 text-sm font-mono whitespace-pre-wrap">{output}</pre>}
    </div>
  )
}
