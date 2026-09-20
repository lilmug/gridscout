import { notFound } from "next/navigation";
import { initialProjects } from "@/app/data/projects";
import ProjectDetail from "./ProjectDetail";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const project = initialProjects.find((item) => item.id === Number(id));

  if (!project) {
    const projectId = Number(id);
    if (!Number.isFinite(projectId)) notFound();
    return (
      <ProjectDetail
        initialProject={{
          id: projectId,
          name: "Project",
          technology: "Solar PV",
          capacity: 0,
          location: "France",
          status: "Screening",
          coordinates: [46.6034, 1.8883],
          locationSelected: false,
        }}
      />
    );
  }

  return <ProjectDetail initialProject={project} />;
}
