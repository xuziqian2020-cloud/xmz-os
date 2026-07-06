// 占位页面组件 — 用于所有 CRUD 模块页面
// 阶段 4+ 各自实现时会替换此内容
import { Construction } from "lucide-react"

export function PlaceholderPage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div>
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>

      <div className="mt-12 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
        <Construction className="mb-3 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">此模块将在后续阶段实现</p>
        <p className="mt-1 text-xs text-muted-foreground/60">当前页面为占位路由</p>
      </div>
    </div>
  )
}
