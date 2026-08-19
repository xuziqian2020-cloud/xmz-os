import {
  enterpriseProjects,
  getCompletedSkills,
  getUnmetPrerequisites,
  learningModules,
  miniPractices,
} from "@/lib/learning/catalog"

export type LearningContentType = "lesson" | "practice" | "project"

const lessons = learningModules.flatMap((module) => module.lessons)

/** XMZADD 20260819 核验客户端提交的学习对象确实存在于版本化课程目录中。 */
export function isKnownLearningContent(contentType: LearningContentType, contentSlug: string) {
  if (contentType === "lesson") return lessons.some((lesson) => lesson.slug === contentSlug)
  if (contentType === "practice") return miniPractices.some((practice) => practice.slug === contentSlug)
  return enterpriseProjects.some((project) => project.slug === contentSlug)
}

/** XMZADD 20260819 根据已完成课程计算练习或企业项目尚缺的能力，避免通过直链绕过解锁。 */
export function getLearningAccessGaps(contentType: LearningContentType, contentSlug: string, completedLessonSlugs: string[]) {
  if (contentType === "lesson") {
    const index = lessons.findIndex((lesson) => lesson.slug === contentSlug)
    if (index > 0 && !completedLessonSlugs.includes(lessons[index - 1].slug)) return [lessons[index - 1].title]
    return []
  }

  const prerequisites = contentType === "practice"
    ? miniPractices.find((practice) => practice.slug === contentSlug)?.prerequisites
    : enterpriseProjects.find((project) => project.slug === contentSlug)?.prerequisites

  if (!prerequisites) return ["课程目录"]
  return getUnmetPrerequisites(prerequisites, getCompletedSkills(completedLessonSlugs))
}
