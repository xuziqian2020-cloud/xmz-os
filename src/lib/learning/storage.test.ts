import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

describe("learning center persistence", () => {
  it("creates learner-owned progress, notes, attempts, and project evidence tables with RLS", () => {
    const source = readFileSync("supabase/migrations/004_learning_center.sql", "utf8")

    assert.match(source, /CREATE TABLE IF NOT EXISTS learning_progress/)
    assert.match(source, /CREATE TABLE IF NOT EXISTS learning_notes/)
    assert.match(source, /CREATE TABLE IF NOT EXISTS learning_code_attempts/)
    assert.match(source, /CREATE TABLE IF NOT EXISTS learning_project_evidence/)
    assert.match(source, /CREATE INDEX IF NOT EXISTS idx_learning_progress_user_content/)
    assert.match(source, /ENABLE ROW LEVEL SECURITY/)
    assert.match(source, /auth\.uid\(\) = user_id/)
    assert.match(source, /status IN \('in_progress', 'completed'\)/)
  })

  it("exposes authenticated progress, notes, and project evidence APIs", () => {
    const progress = readFileSync("src/app/api/learning/progress/route.ts", "utf8")
    const notes = readFileSync("src/app/api/learning/notes/route.ts", "utf8")
    const evidence = readFileSync("src/app/api/learning/evidence/route.ts", "utf8")

    assert.match(progress, /export async function GET/)
    assert.match(progress, /export async function PUT/)
    assert.match(progress, /auth\.getUser\(\)/)
    assert.match(progress, /from\("learning_progress"\)/)
    assert.match(progress, /upsert/)
    assert.match(notes, /from\("learning_notes"\)/)
    assert.match(notes, /export async function PUT/)
    assert.match(evidence, /from\("learning_project_evidence"\)/)
    assert.match(evidence, /export async function POST/)
  })

  it("stores Python practice attempts without accepting browser-side secrets", () => {
    const attempts = readFileSync("src/app/api/learning/attempts/route.ts", "utf8")
    const progress = readFileSync("src/app/api/learning/progress/route.ts", "utf8")
    const evidence = readFileSync("src/app/api/learning/evidence/route.ts", "utf8")

    assert.match(attempts, /export async function POST/)
    assert.match(attempts, /from\("learning_code_attempts"\)/)
    assert.match(attempts, /content_type/)
    assert.match(attempts, /content_slug/)
    assert.match(attempts, /code.length > 20000/)
    assert.match(attempts, /getLearningAccessGaps/)
    assert.match(evidence, /getLearningAccessGaps/)
    assert.match(progress, /status === "accepted"/)
    assert.match(progress, /getLearningAccessGaps/)
    assert.match(progress, /requiredEvidenceTypes/)
  })

  it("requires a passed lesson attempt before a learner can unlock the next capability", () => {
    const progress = readFileSync("src/app/api/learning/progress/route.ts", "utf8")
    const lesson = readFileSync("src/components/learning/lesson-workspace.tsx", "utf8")
    const dashboard = readFileSync("src/components/learning/learning-center.tsx", "utf8")

    assert.match(progress, /contentType === "lesson" && status === "completed"/)
    assert.match(progress, /from\("learning_code_attempts"\)/)
    assert.match(progress, /\.eq\("content_type", "lesson"\)/)
    assert.match(progress, /\.eq\("passed", true\)/)
    assert.match(lesson, /onPassed=\{\(code, output\) => completeLesson\(code, output\)\}/)
    assert.doesNotMatch(lesson, /onClick=\{completeLesson\}/)
    assert.doesNotMatch(dashboard, /markLessonComplete/)
  })

  it("allows graduation acceptance only through a reviewer-controlled UAT record", () => {
    const source = readFileSync("supabase/migrations/004_learning_center.sql", "utf8")
    const reviews = readFileSync("src/app/api/learning/reviews/route.ts", "utf8")

    assert.match(source, /reviewer_id/)
    assert.match(source, /learning_reviewer/)
    assert.match(source, /reviewer accepts graduation projects/)
    assert.match(source, /user_id <> auth\.uid\(\)/)
    assert.match(reviews, /user\.app_metadata\?\.learning_reviewer/)
    assert.match(reviews, /targetUserId === user\.id/)
    assert.match(reviews, /requiredEvidenceTypes/)
    assert.match(reviews, /status: decision === "accepted" \? "accepted" : "completed"/)
  })
})
