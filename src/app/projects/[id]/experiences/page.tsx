import { redirect } from "next/navigation"

/** XMZADD 20260720 将项目经验库旧入口兼容跳转到项目知识库。 */
export default function ProjectExperiencesPage({ params }: { params: { id: string } }) {
  redirect(`/projects/${params.id}/knowledge`)
}
