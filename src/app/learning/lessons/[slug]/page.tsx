import { notFound } from "next/navigation"
import { LessonWorkspace } from "@/components/learning/lesson-workspace"
import { learningModules } from "@/lib/learning/catalog"

/** XMZADD 20260819 根据课程标识展示对应的学习和代码练习页面。 */
export default function LearningLessonPage({ params }: { params: { slug: string } }) {
  const lessons = learningModules.flatMap((module) => module.lessons)
  const lessonIndex = lessons.findIndex((item) => item.slug === params.slug)
  const lesson = lessons[lessonIndex]
  if (!lesson) notFound()

  return <LessonWorkspace lesson={lesson} previousLesson={lessons[lessonIndex - 1]} nextLesson={lessons[lessonIndex + 1]} />
}
