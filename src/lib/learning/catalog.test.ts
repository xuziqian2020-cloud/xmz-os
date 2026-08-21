import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  enterpriseProjects,
  getCompletedSkills,
  getGraduationStatus,
  getUnmetPrerequisites,
  getUnlockedPractices,
  learningModules,
  miniPractices,
} from "./catalog"

describe("learning catalog", () => {
  it("publishes the complete 36-month curriculum with 30 mini practices and 40 enterprise projects", () => {
    assert.equal(learningModules.length, 8)
    assert.equal(miniPractices.length, 30)
    assert.equal(enterpriseProjects.length, 40)
    assert.equal(enterpriseProjects.filter((project) => project.track === "general").length, 10)
    assert.equal(enterpriseProjects.filter((project) => project.track === "k3").length, 10)
    assert.equal(enterpriseProjects.filter((project) => project.track === "manufacturing").length, 20)
  })

  it("unlocks the chat bot mini practice after Python, HTTP, and LLM capabilities are complete", () => {
    const unlocked = getUnlockedPractices(["python-basics", "http-json", "llm-api"])

    assert.ok(unlocked.some((practice) => practice.slug === "llm-chatbot"))
    assert.ok(!unlocked.some((practice) => practice.slug === "enterprise-rag"))
  })

  it("calculates unmet prerequisites from completed lessons for server-side lock checks", () => {
    assert.deepEqual(getCompletedSkills(["python-environment", "http-json"]), ["python-basics", "http-json"])
    assert.deepEqual(getUnmetPrerequisites(["python-basics", "http-json", "llm-api"], ["python-basics", "http-json"]), ["llm-api"])
  })

  it("awards graduation only after every required general Agent project is accepted", () => {
    const accepted = enterpriseProjects
      .filter((project) => project.track === "general")
      .map((project) => project.slug)

    assert.deepEqual(getGraduationStatus(accepted), {
      accepted: 10,
      required: 10,
      graduated: true,
    })
    assert.equal(getGraduationStatus(accepted.slice(0, 9)).graduated, false)
  })
})
