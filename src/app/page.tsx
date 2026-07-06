// 根路由 — 重定向到 dashboard（阶段 3 加入 Auth 检查）
import { redirect } from "next/navigation"

export default function Home() {
  redirect("/dashboard")
}
