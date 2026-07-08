// 项目详情页 — 子模块导航
import Link from "next/link"
import { notFound } from "next/navigation"
import { getProject, getProjectStats } from "@/lib/data/projects"
import { BookOpen, Bug, FileText, GitBranch, Lightbulb, ListTodo, Sparkles, BarChart3, MessageSquare } from "lucide-react"

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id)
  if (!project) notFound()

  const stats = await getProjectStats(params.id)

  const navItems = [
    { label: "计划", href: `/projects/${project.id}/plans`, icon: ListTodo, count: stats.planCount },
    { label: "知识库", href: `/projects/${project.id}/knowledge`, icon: BookOpen, count: stats.knowledgeCount },
    { label: "Bug", href: `/projects/${project.id}/bugs`, icon: Bug, count: stats.bugCount },
    { label: "Prompt", href: `/projects/${project.id}/prompts`, icon: MessageSquare, count: undefined },
    { label: "流程图", href: `/projects/${project.id}/process`, icon: GitBranch, count: undefined },
    { label: "文件", href: `/projects/${project.id}/files`, icon: FileText, count: stats.fileCount },
    { label: "灵感", href: `/projects/${project.id}/ideas`, icon: Lightbulb, count: stats.ideaCount },
    { label: "报表", href: `/projects/${project.id}/reports`, icon: BarChart3, count: undefined },
    { label: "经验库", href: `/projects/${project.id}/experiences`, icon: Sparkles, count: undefined },
  ]

  return (
    <div className="space-y-6">
      {/* 项目基本信息 */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{project.name}</h1>
            {project.code && (
              <span className="rounded bg-secondary px-2 py-0.5 text-xs font-mono text-muted-foreground">
                {project.code}
              </span>
            )}
          </div>
          {project.description && (
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{project.description}</p>
          )}
          {/* 技术栈 */}
          {project.tech_stack && project.tech_stack.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.tech_stack.map((tech) => (
                <span key={tech} className="rounded-full bg-secondary/70 px-2 py-0.5 text-[11px] text-muted-foreground">
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${project.id}/edit`}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:border-primary/20"
          >
            编辑
          </Link>
        </div>
      </div>

      {/* 子模块导航卡片 */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            {item.count !== undefined && (
              <span className="text-xs text-muted-foreground">{item.count}</span>
            )}
          </Link>
        ))}
      </div>

      {/* Git 信息 */}
      {project.git_url && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">仓库地址：</span>
            <a
              href={project.git_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {project.git_url}
            </a>
          </div>
          {project.local_path && (
            <p className="mt-1 flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">本地路径：</span>
              <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">{project.local_path}</code>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
