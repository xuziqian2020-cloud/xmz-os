// 项目列表页 — 支持演示模式
import Link from "next/link"
import { Plus, FolderGit2 } from "lucide-react"
import { DeleteButton } from "@/components/common/delete-button"

export default async function ProjectsPage() {
  let projects: any[] = []
  try {
    const { getProjects } = await import("@/lib/data/projects")
    projects = await getProjects()
  } catch {
    projects = []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">项目</h1>
          <p className="mt-1 text-sm text-muted-foreground">管理你的所有研发项目</p>
        </div>
        <Link href="/projects/new" className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90">
          <Plus className="h-4 w-4" />新建项目
        </Link>
      </div>
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20">
          <FolderGit2 className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">暂无项目</p>
          <p className="mt-1 text-xs text-muted-foreground/60">点击「新建项目」开始</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="group rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/20 hover:shadow-sm">
              <Link href={`/projects/${project.id}`} className="block">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium group-hover:text-primary">{project.name}</h3>
                  {project.code && <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">{project.code}</span>}
                </div>
                {project.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>}
                {project.tech_stack && project.tech_stack.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {project.tech_stack.slice(0, 4).map((tech: string) => <span key={tech} className="rounded bg-secondary/70 px-1.5 py-0.5 text-[11px] text-muted-foreground">{tech}</span>)}
                  </div>
                )}
              </Link>
              <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span className="flex min-w-0 items-center gap-3">
                  {project.project_type && <span className="rounded bg-secondary/50 px-1.5 py-0.5">{project.project_type}</span>}
                  <span className="truncate">更新于 {new Date(project.updated_at).toLocaleDateString("zh-CN")}</span>
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <Link href={`/projects/${project.id}/edit`} className="rounded-md border border-border px-2 py-1 transition-colors hover:text-foreground">编辑</Link>
                  <DeleteButton endpoint={`/api/projects/${project.id}`} confirmText={`确定删除项目「${project.name}」吗？`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
