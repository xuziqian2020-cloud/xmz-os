import { notFound } from "next/navigation"
import { ProjectWorkbench } from "@/components/learning/project-workbench"
import { enterpriseProjects } from "@/lib/learning/catalog"

/** XMZADD 20260819 根据项目标识展示对应的企业级项目工作台。 */
export default function LearningProjectPage({ params }: { params: { slug: string } }) {
  const project = enterpriseProjects.find((item) => item.slug === params.slug)
  if (!project) notFound()

  return <ProjectWorkbench project={project} />
}
