import { initialProjects, type Project } from "./projects";

export const PROJECTS_STORAGE_KEY = "gridscout-projects";
export const PROJECTS_CHANGED_EVENT = "gridscout-projects-changed";

export function loadProjects(): Project[] {
  if (typeof window === "undefined") return initialProjects;
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(PROJECTS_STORAGE_KEY) ?? "null",
    ) as Project[] | null;
    return Array.isArray(stored) ? stored : initialProjects;
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
