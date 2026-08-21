import { notFound } from "next/navigation"
import { PracticeWorkbench } from "@/components/learning/practice-workbench"
import { miniPractices } from "@/lib/learning/catalog"

/** XMZADD 20260819 根据实战标识展示浏览器或 PyCharm 对应的练习工作台。 */
export default function LearningPracticePage({ params }: { params: { slug: string } }) {
  const practice = miniPractices.find((item) => item.slug === params.slug)
  if (!practice) notFound()

  return <PracticeWorkbench practice={practice} />
}
