// 通用空状态组件
import { Inbox } from "lucide-react"

export function EmptyState({
  message = "暂无数据",
  icon: Icon = Inbox,
  action,
}: {
  message?: string
  icon?: React.ComponentType<{ className?: string }>
  action?: { label: string; onClick: () => void } | { label: string; href: string }
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
      <Icon className="mb-3 h-8 w-8 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {action && (
        "href" in action ? (
          <a
            href={action.href}
            className="mt-4 rounded-md bg-foreground px-4 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90"
          >
            {action.label}
          </a>
        ) : (
          <button
            onClick={action.onClick}
            className="mt-4 rounded-md bg-foreground px-4 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  )
}
