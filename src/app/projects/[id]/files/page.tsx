import { ProjectModuleView } from "@/components/project/project-module-view"

export default function ProjectFilesPage({ params }: { params: { id: string } }) {
  return <ProjectModuleView projectId={params.id} moduleKey="files" />
}
