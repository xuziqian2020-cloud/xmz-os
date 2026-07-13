import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, it } from "node:test"

const root = process.cwd()

const modules = [
  { name: "项目", list: "src/app/projects/page.tsx", newPage: "src/app/projects/new/page.tsx", edit: "src/app/projects/[id]/edit/page.tsx", api: "src/app/api/projects/[id]/route.ts", newText: "新建项目", editText: "编辑", deleteText: "删除" },
  { name: "工作计划", list: "src/app/plans/page.tsx", newPage: "src/app/plans/new/page.tsx", edit: "src/app/plans/[id]/edit/page.tsx", api: "src/app/api/work-plans/[id]/route.ts", newText: "新建计划", editText: "编辑", deleteText: "删除" },
  { name: "Bug 库", list: "src/app/bugs/page.tsx", newPage: "src/app/plans/new/page.tsx", edit: "src/app/plans/[id]/edit/page.tsx", api: "src/app/api/work-plans/[id]/route.ts", newText: "报告 Bug", editText: "编辑", deleteText: "删除" },
  { name: "知识库", list: "src/app/knowledge/page.tsx", newPage: "src/app/knowledge/new/page.tsx", edit: "src/app/knowledge/[id]/edit/page.tsx", api: "src/app/api/knowledge/[id]/route.ts", newText: "新建文档", editText: "编辑", deleteText: "删除" },
  { name: "经验库", list: "src/app/experiences/page.tsx", newPage: "src/app/knowledge/new/page.tsx", edit: "src/app/knowledge/[id]/edit/page.tsx", api: "src/app/api/knowledge/[id]/route.ts", newText: "新增经验", editText: "编辑", deleteText: "删除" },
  { name: "文件", list: "src/app/files/page.tsx", newPage: "src/app/files/page.tsx", edit: "src/app/files/page.tsx", api: "src/app/api/files/[id]/route.ts", newText: "上传文件", editText: "重命名", deleteText: "删除" },
  { name: "灵感箱", list: "src/app/ideas/page.tsx", newPage: "src/app/ideas/new/page.tsx", edit: "src/app/ideas/[id]/edit/page.tsx", api: "src/app/api/ideas/[id]/route.ts", newText: "新增灵感", editText: "编辑", deleteText: "删除" },
]

describe("核心模块 CRUD 体检", () => {
  for (const module of modules) {
    it(`${module.name} 有查询、新增、编辑、删除入口`, () => {
      assert.ok(existsSync(join(root, module.list)), `${module.name} 缺查询页`)
      assert.ok(existsSync(join(root, module.newPage)), `${module.name} 缺新增入口`)
      assert.ok(existsSync(join(root, module.edit)), `${module.name} 缺编辑入口`)

      const apiSource = readFileSync(join(root, module.api), "utf8")
      assert.match(apiSource, /export async function (PUT|PATCH)/, `${module.name} 缺更改接口`)
      assert.match(apiSource, /export async function DELETE/, `${module.name} 缺删除接口`)

      const listSource = readFileSync(join(root, module.list), "utf8")
      assert.match(listSource, new RegExp(module.newText), `${module.name} 列表页缺新增按钮文案`)
      assert.match(listSource, new RegExp(module.editText), `${module.name} 列表页缺编辑入口文案`)
      assert.match(listSource, new RegExp(module.deleteText), `${module.name} 列表页缺删除入口文案`)
    })
  }
})
