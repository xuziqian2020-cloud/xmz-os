"use client"
import { useState } from "react"

export default function SqlFormatterPage() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")

  // 简单 SQL 格式化（完整版使用 sql-formatter 库）
  const format = () => {
    try {
      let sql = input.trim()
      const keywords = ["SELECT", "FROM", "WHERE", "AND", "OR", "JOIN", "LEFT JOIN", "INNER JOIN", "ON", "ORDER BY", "GROUP BY", "HAVING", "LIMIT", "OFFSET", "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM", "CREATE TABLE", "ALTER TABLE", "DROP TABLE", "INDEX", "UNION", "AS", "IN", "NOT", "NULL", "IS", "LIKE", "BETWEEN", "EXISTS"]
      keywords.forEach(kw => {
        const re = new RegExp(`\\b${kw}\\b`, "gi")
        sql = sql.replace(re, `\n${kw.toUpperCase()}`)
      })
      sql = sql.replace(/,\s*/g, ",\n  ")
      sql = sql.replace(/\n{2,}/g, "\n")
      setOutput(sql.trim())
    } catch {
      setOutput("格式化失败，请检查 SQL 语法")
    }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-lg font-semibold">SQL 格式化</h1><p className="mt-1 text-sm text-muted-foreground">格式化 SQL 语句使其更易读</p></div>
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="粘贴 SQL 语句..." rows={10} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:border-primary/30 resize-y" />
      <button onClick={format} disabled={!input.trim()} className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40">格式化</button>
      {output && <pre className="overflow-x-auto rounded-lg border border-border bg-card p-4 text-sm font-mono whitespace-pre-wrap">{output}</pre>}
    </div>
  )
}
