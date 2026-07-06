// 知识库列表页
import Link from "next/link"

export default async function KnowledgePage({ searchParams }: { searchParams?: { q?: string; cat?: string } }) {
  let docs: any[] = []
  try {
    const { getKnowledgeDocuments } = await import("@/lib/data/knowledge")
    docs = await getKnowledgeDocuments({ search: searchParams?.q, category: searchParams?.cat })
  } catch { docs = [] }

  const categories = Array.from(new Set(docs.map(d => d.category).filter(Boolean))) as string[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-semibold">知识库</h1><p className="mt-1 text-sm text-muted-foreground">项目知识和文档管理</p></div>
        <Link href="/knowledge/new" className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90">+ 新建文档</Link>
      </div>
      <div className="flex gap-3">
        <form className="flex-1" action="/knowledge" method="GET">
          <input name="q" defaultValue={searchParams?.q} placeholder="搜索文档标题或内容..." className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20" />
        </form>
        {categories.length > 0 && (
          <select onChange={e => { const v = e.target.value; window.location.href = v ? `/knowledge?cat=${v}` : "/knowledge" }} defaultValue={searchParams?.cat || ""} className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none">
            <option value="">全部分类</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>
      {docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20">
          <p className="text-sm text-muted-foreground">暂无文档</p>
          <Link href="/knowledge/new" className="mt-3 text-sm text-primary hover:underline">创建第一篇文档</Link>
        </div>
      ) : (
        <div className="space-y-2">{docs.map(doc => (
          <Link key={doc.id} href={`/knowledge/${doc.id}`} className="block rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/10 hover:bg-secondary/30">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{doc.title}</h3>
              {doc.category && <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">{doc.category}</span>}
            </div>
            {doc.tags && doc.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{doc.tags.map((tag: string) => <span key={tag} className="rounded-full bg-secondary/70 px-2 py-0.5 text-[10px] text-muted-foreground">{tag}</span>)}</div>}
            <p className="mt-1 text-xs text-muted-foreground">更新于 {new Date(doc.updated_at).toLocaleDateString("zh-CN")}</p>
          </Link>
        ))}</div>
      )}
    </div>
  )
}
