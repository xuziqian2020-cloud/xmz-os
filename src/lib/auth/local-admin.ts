export const ADMIN_LOGIN_NAME = "徐小美"
export const ADMIN_REMEMBER_FLAG = "xmz-os-admin-login"
export const REMEMBER_CREDENTIALS_KEY = "xmz-os-remembered-login"

export function isAdminLoginName(value: string): boolean {
  return value.trim() === ADMIN_LOGIN_NAME
}

export function normalizeLoginName(value: string): string {
  return value.trim().toLowerCase()
}

export function buildLocalAdminHeaders(enabled: boolean): Record<string, string> {
  if (!enabled) return {}
  return { "x-xmz-local-admin": "1" }
}
