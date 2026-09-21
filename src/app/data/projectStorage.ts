import { initialProjects, type Project } from "./projects";

export const PROJECTS_CHANGED_EVENT = "gridscout-projects-changed";
export const PROJECTS_STORAGE_KEY = "gridscout-projects";

function isProject(value: unknown): value is Project {
  if (!value || typeof value !== "object") return false;
  const project = value as Partial<Project>;
  return typeof project.id === "number" && typeof project.name === "string";
}

function localProjects() {
  try {
    const stored = JSON.parse(localStorage.getItem(PROJECTS_STORAGE_KEY) ?? "null") as unknown;
    return Array.isArray(stored) && stored.every(isProject) ? stored : initialProjects;
  } catch (error) {
    console.error("Unable to read local project fallback.", error);
    return initialProjects;
  }
}

export async function loadProjects(): Promise<Project[]> {
  try {
    const response = await fetch("/api/projects", { cache: "no-store" });
    if (!response.ok) throw new Error(`Project request failed (${response.status})`);
    const projects = await response.json() as unknown;
    if (!Array.isArray(projects) || !projects.every(isProject)) throw new Error("Invalid projects response.");
    return projects;
  } catch (error) {
    console.error("Unable to load shared projects.", error);
    return typeof window === "undefined" ? initialProjects : localProjects();
  }
}

export async function saveProjects(projects: Project[]) {
  await Promise.all(projects.map((project) => saveProject(project)));
}

export async function saveProject(project: Project) {
  try {
    const response = await fetch("/api/projects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });
    if (!response.ok) throw new Error(`Project save failed (${response.status})`);
    window.dispatchEvent(new Event(PROJECTS_CHANGED_EVENT));
  } catch (error) {
    console.error("Unable to save shared project.", error);
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(localProjects().some((item) => item.id === project.id)
        ? localProjects().map((item) => item.id === project.id ? project : item)
        : [project, ...localProjects()]));
    } catch (fallbackError) {
      console.error("Unable to save local project fallback.", fallbackError);
    }
  }
}
