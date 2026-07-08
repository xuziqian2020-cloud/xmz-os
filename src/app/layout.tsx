// 根布局，负责 HTML 框架、Providers 和 Toast。
import type { Metadata } from "next"
import { Providers } from "@/components/layout/providers"
import { AppLayout } from "@/components/layout/app-layout"
import { ToastProvider } from "@/components/common/toast"
import "./globals.css"

export const metadata: Metadata = {
  title: "XMZ OS | 个人研发工作 OS",
  description: "一个给软件开发人员使用的个人第二大脑系统",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <Providers>
          <ToastProvider>
            <AppLayout>{children}</AppLayout>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  )
}
