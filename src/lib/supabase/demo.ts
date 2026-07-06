// 演示模式 — 未配置真实 Supabase 时使用模拟数据
export { isDemoMode } from "./config"

const DEMO_KEY = "xmz-os-demo"
export function getDemoUserId(): string { return DEMO_KEY }
