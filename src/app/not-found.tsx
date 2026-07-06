// 404 页面
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-4 text-6xl font-light text-muted-foreground/30">404</div>
      <h2 className="text-lg font-semibold">页面未找到</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        你访问的页面不存在或已被移除。
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        返回工作台
      </Link>
    </div>
  )
}
