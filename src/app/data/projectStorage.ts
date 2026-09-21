import { initialProjects, type Project } from "./projects";

export const PROJECTS_STORAGE_KEY = "gridscout-projects";
export const PROJECTS_CHANGED_EVENT = "gridscout-projects-changed";

function isProject(value: unknown): value is Project {
  if (!value || typeof value !== "object") return false;
  const project = value as Partial<Project>;
  return (
    typeof project.id === "number" &&
    typeof project.name === "string" &&
    typeof project.technology === "string" &&
    typeof project.capacity === "number" &&
    Number.isFinite(project.capacity) &&
    typeof project.location === "string" &&
    typeof project.status === "string" &&
    Array.isArray(project.coordinates) &&
    project.coordinates.length === 2 &&
    project.coordinates.every(
      (coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate),
    )
  );
}

export function loadProjects(): Project[] {
  if (typeof window === "undefined") return initialProjects;
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(PROJECTS_STORAGE_KEY) ?? "null",
    ) as Project[] | null;
    return Array.isArray(stored) && stored.every(isProject) ? stored : initialProjects;
  } catch (error) {
    console.error("Unable to load projects from local storage.", error);
    return initialProjects;
  }
}

export function saveProjects(projects: Project[]) {
  try {
    window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    window.dispatchEvent(new Event(PROJECTS_CHANGED_EVENT));
  } catch (error) {
    console.error("Unable to save projects to local storage.", error);
  }
}

export function saveProject(project: Project) {
  const projects = loadProjects();
  const next = projects.some((item) => item.id === project.id)
    ? projects.map((item) => (item.id === project.id ? project : item))
    : [project, ...projects];
  saveProjects(next);
}
