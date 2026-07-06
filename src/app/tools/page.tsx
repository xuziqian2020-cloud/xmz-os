// 本地 AI 工具
"use client"
import { useState } from "react"

export default function ToolsPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-lg font-semibold">本地 AI 工具</h1><p className="mt-1 text-sm text-muted-foreground">常用的开发辅助工具</p></div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ToolCard title="SQL 格式化" desc="格式化 SQL 语句" icon="🗄️" href="/tools/sql-formatter" />
        <ToolCard title="JSON 格式化" desc="格式化 + 校验 JSON" icon="📦" href="/tools/json-formatter" />
        <ToolCard title="OCR 识别" desc="图片文字识别（TODO）" icon="🔍" />
        <ToolCard title="PDF 转 Markdown" desc="PDF 文档转换（TODO）" icon="📄" />
        <ToolCard title="Word 转 Markdown" desc="Word 文档转换（TODO）" icon="📝" />
        <ToolCard title="语音转文字" desc="语音文件转文字（TODO）" icon="🎙️" />
      </div>
    </div>
  )
}

function ToolCard({ title, desc, icon, href }: { title: string; desc: string; icon: string; href?: string }) {
  const className = "rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/20 hover:shadow-sm " + (href ? "cursor-pointer" : "cursor-not-allowed opacity-60")
  const content = (
    <>
      <span className="text-2xl">{icon}</span>
      <h3 className="mt-3 text-sm font-medium">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </>
  )
  return href ? <a href={href} className={className}>{content}</a> : <div className={className}>{content}</div>
}
