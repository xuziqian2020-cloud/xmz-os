"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

export default function DiagramDetailPage() {
  const params = useParams(); const id = params.id as string
  const router = useRouter()
  const [diagram, setDiagram] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/diagrams/${id}`).then(r => r.json()).then(d => setDiagram(d)).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">加载中...</div>
  if (!diagram) return <div className="py-20 text-center text-sm text-muted-foreground">流程图不存在</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-semibold">{diagram.title}</h1>
          {diagram.description && <p className="mt-1 text-sm text-muted-foreground">{diagram.description}</p>}
        </div>
        <Link href={`/process/${diagram.id}/edit`} className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">编辑</Link>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-medium">Mermaid 代码</h3>
        <pre className="overflow-x-auto rounded bg-secondary/50 p-4 text-sm font-mono whitespace-pre-wrap">{diagram.mermaid_content}</pre>
      </div>
    </div>
  )
}
