import Link from "next/link"
import { BookMarked, Plus } from "lucide-react"

export default async function ExperiencesPage() {
  let docs: any[] = []
  try {
    const { getKnowledgeDocuments } = await import("@/lib/data/knowledge")
    docs = await getKnowledgeDocuments({ category: "经验库" })
  } catch {
    docs = []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--accent))]">Experience</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal">经验库</h1>
          <p className="mt-1 text-sm text-muted-foreground">沉淀踩坑记录、上线经验、排查路径和可复用做法</p>
        </div>
        <Link href="/knowledge/new?category=经验库" className="inline-flex items-center gap-2 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">
          <Plus className="h-4 w-4" />
          新增经验
        </Link>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
          <BookMarked className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-4 text-sm font-medium">暂无经验记录</p>
          <p className="mt-1 text-sm text-muted-foreground">可以先把最近一次问题处理或上线复盘录入进来。</p>
          <Link href="/knowledge/new?category=经验库" className="mt-4 inline-flex rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary">
            创建第一条经验
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {docs.map(doc => (
            <Link key={doc.id} href={`/knowledge/${doc.id}`} className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-[hsl(var(--accent)/0.45)] hover:bg-secondary/40">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-sm font-semibold">{doc.title}</h2>
                <span className="rounded bg-secondary px-2 py-1 text-[11px] text-muted-foreground">经验</span>
              </div>
              {doc.content && <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{doc.content}</p>}
              {doc.tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {doc.tags.map((tag: string) => <span key={tag} className="rounded-full bg-secondary/70 px-2 py-0.5 text-[10px] text-muted-foreground">{tag}</span>)}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
