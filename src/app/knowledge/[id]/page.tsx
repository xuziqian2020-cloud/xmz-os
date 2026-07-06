import Link from "next/link"
import { notFound } from "next/navigation"
import { getKnowledgeDocument } from "@/lib/data/knowledge"

export default async function KnowledgeDetailPage({ params }: { params: { id: string } }) {
  const doc = await getKnowledgeDocument(params.id)
  if (!doc) notFound()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {doc.category && <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">{doc.category}</span>}
            {doc.source && <span className="text-xs text-muted-foreground">来源：{doc.source}</span>}
          </div>
          <h1 className="text-xl font-semibold">{doc.title}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/knowledge/${doc.id}/edit`} className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">编辑</Link>
        </div>
      </div>
      {doc.tags && doc.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {doc.tags.map(tag => <span key={tag} className="rounded-full bg-secondary/70 px-2 py-0.5 text-xs text-muted-foreground">{tag}</span>)}
        </div>
      )}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm">
          {doc.content || <span className="text-muted-foreground">暂无内容</span>}
        </div>
      </div>
    </div>
  )
}
