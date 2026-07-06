import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const dashboardPath = path.join(root, "src", "app", "dashboard", "page.tsx")
const sidebarPath = path.join(root, "src", "components", "layout", "sidebar.tsx")
const headerPath = path.join(root, "src", "components", "layout", "header.tsx")
const globalsPath = path.join(root, "src", "app", "globals.css")
const postcssPath = path.join(root, "postcss.config.cjs")

function read(filePath) {
  return fs.readFileSync(filePath, "utf8")
}

const dashboard = read(dashboardPath)
const sidebar = read(sidebarPath)
const header = read(headerPath)
const globals = read(globalsPath)
const postcss = read(postcssPath)

const requiredDashboardCopy = [
  "研发指挥中心",
  "小美待办雷达",
  "今日推进队列",
  "项目沙箱",
  "快速捕获",
]

for (const text of requiredDashboardCopy) {
  assert.ok(dashboard.includes(text), `Dashboard 缺少关键区域：${text}`)
}

assert.ok(sidebar.includes("产品导航"), "Sidebar 需要呈现为产品级导航")
assert.ok(header.includes("全局搜索"), "Header 需要提供全局搜索入口")
assert.ok(globals.includes("--accent"), "全局样式需要锁定统一强调色")
assert.ok(postcss.includes("module.exports"), "postcss.config.cjs 必须使用 CommonJS 导出，匹配当前 Next 13 的配置查找逻辑")
assert.equal(fs.existsSync(path.join(root, "postcss.config.mjs")), false, "当前 Next 13 不读取 postcss.config.mjs，避免留下误导配置")

const visibleEmojiPattern = /[\u{1F300}-\u{1FAFF}]/u
assert.equal(visibleEmojiPattern.test(dashboard), false, "Dashboard 不应再使用表情符号做 UI 图标")

console.log("dashboard redesign checks passed")
