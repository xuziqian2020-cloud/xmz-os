import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { describe, it } from "node:test"

describe("learning center UI", () => {
  it("adds a standalone learning center entry without replacing the knowledge base", () => {
    const menu = readFileSync("src/lib/menu-items.ts", "utf8")

    assert.match(menu, /label: "学习中心", href: "\/learning"/)
    assert.match(menu, /label: "知识库", href: "\/knowledge"/)
  })

  it("renders the practice-first dashboard, course completion, notes, and project routes", () => {
    const dashboard = readFileSync("src/components/learning/learning-center.tsx", "utf8")
    const page = readFileSync("src/app/learning/page.tsx", "utf8")
    const project = readFileSync("src/app/learning/projects/[slug]/page.tsx", "utf8")
    const notes = readFileSync("src/app/learning/notes/page.tsx", "utf8")

    assert.match(dashboard, /从零开始，边学边做/)
    assert.match(dashboard, /现在开始做/)
    assert.match(dashboard, /通过代码练习后自动完成/)
    assert.match(dashboard, /独立笔记/)
    assert.match(dashboard, /毕业项目/)
    assert.match(page, /LearningCenter/)
    assert.match(project, /ProjectWorkbench/)
    assert.match(notes, /LearningNotes/)
  })

  it("keeps the long learning path reachable on narrow screens", () => {
    const dashboard = readFileSync("src/components/learning/learning-center.tsx", "utf8")

    assert.match(
      dashboard,
      /<div className="overflow-x-auto">\s*<ol className="grid min-w-\[800px\]/,
    )
  })

  it("does not let a direct practice URL bypass prerequisite checks", () => {
    const practice = readFileSync("src/components/learning/practice-workbench.tsx", "utf8")

    assert.match(practice, /getUnmetPrerequisites/)
    assert.match(practice, /accessGaps\.length > 0/)
  })

  it("keeps future project guides visible but blocks delivery evidence before unlock", () => {
    const project = readFileSync("src/components/learning/project-workbench.tsx", "utf8")

    assert.match(project, /getUnmetPrerequisites/)
    assert.match(project, /accessGaps\.length > 0/)
  })

  it("keeps course breadcrumbs reachable and lets learners move between lessons", () => {
    const header = readFileSync("src/components/layout/header.tsx", "utf8")
    const lessonWorkspace = readFileSync("src/components/learning/lesson-workspace.tsx", "utf8")
    const lessonPage = readFileSync("src/app/learning/lessons/[slug]/page.tsx", "utf8")

    assert.match(header, /learning:/)
    assert.match(header, /lessons:/)
    assert.match(header, /pathHref.*learning.*lessons/)
    assert.match(lessonWorkspace, /previousLesson/)
    assert.match(lessonWorkspace, /nextLesson/)
    assert.match(lessonWorkspace, /ArrowRight/)
    assert.match(lessonPage, /previousLesson=/)
    assert.match(lessonPage, /nextLesson=/)
    assert.ok(existsSync("src/app/learning/lessons/page.tsx"))
  })

  it("does not show completion when a learning progress write fails", () => {
    const lessonWorkspace = readFileSync("src/components/learning/lesson-workspace.tsx", "utf8")

    assert.match(lessonWorkspace, /setSaveError/)
    assert.match(lessonWorkspace, /if \(!response\.ok\) throw new Error\(\)/)
    assert.match(lessonWorkspace, /if \(!attemptResponse\.ok\) throw new Error\(\)/)
  })
})
