// 安全的服务端 Supabase 客户端 — 演示模式下返回 null
import { isDemoMode } from "./demo"

let _serverCreateClient: any = null

async function getServerCreateClient() {
  if (!_serverCreateClient) {
    try {
      const mod = await import("./server")
      _serverCreateClient = mod.createClient
    } catch { return null }
  }
  return _serverCreateClient
}

// 返回 supabase client 或 null（演示模式）
export async function getSafeClient() {
  if (isDemoMode()) return null
  try {
    const createClient = await getServerCreateClient()
    if (!createClient) return null
    return createClient()
  } catch { return null }
}
