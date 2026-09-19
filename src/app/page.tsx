"use client";

import { FormEvent, useState } from "react";

type ProjectStatus = "Screening" | "In progress" | "On hold";

type Project = {
  id: number;
  name: string;
  technology: string;
  capacity: number;
  location: string;
  status: ProjectStatus;
};

const initialProjects: Project[] = [
  {
    id: 1,
    name: "North Ridge Solar",
    technology: "Solar PV",
    capacity: 48,
    location: "Occitanie, France",
    status: "Screening",
  },
  {
    id: 2,
    name: "Green Valley Wind",
    technology: "Onshore wind",
    capacity: 72,
    location: "Brittany, France",
    status: "In progress",
  },
];

const statusStyles: Record<ProjectStatus, string> = {
  Screening: "bg-amber-100 text-amber-800",
  "In progress": "bg-emerald-100 text-emerald-800",
  "On hold": "bg-slate-100 text-slate-700",
};

export default function Home() {
  const [projects, setProjects] = useState(initialProjects);
  const [isFormOpen, setIsFormOpen] = useState(false);

  function addProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const project: Project = {
      id: Date.now(),
      name: String(formData.get("name")),
      technology: String(formData.get("technology")),
      capacity: Number(formData.get("capacity")),
      location: String(formData.get("location")),
      status: String(formData.get("status")) as ProjectStatus,
    };

    setProjects((currentProjects) => [project, ...currentProjects]);
    event.currentTarget.reset();
    setIsFormOpen(false);
  }

  return (
    <main className="min-h-screen bg-[#f5f7f6] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <div>
            <p className="text-xl font-semibold tracking-tight text-emerald-950">
              GridScout
            </p>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Connection intelligence
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            Portfolio workspace
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-sm font-medium text-emerald-700">Overview</p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
              Renewable projects
            </h1>
            <p className="mt-3 max-w-xl text-slate-600">
              Keep your portfolio organized and prepare each project for grid
              connection assessment.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsFormOpen((open) => !open)}
            className="rounded-lg bg-emerald-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            {isFormOpen ? "Close form" : "Add project"}
          </button>
        </div>

        {isFormOpen && (
          <form
            onSubmit={addProject}
            className="mb-8 rounded-xl border border-emerald-100 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold">New project</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
              <label className="text-sm font-medium text-slate-700">
                Project name
                <input
                  required
                  name="name"
                  className="form-input"
                  placeholder="e.g. Atlantic Solar"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Technology
                <select required name="technology" className="form-input">
                  <option>Solar PV</option>
                  <option>Onshore wind</option>
                  <option>Battery storage</option>
                  <option>Hydro</option>
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Capacity (MW)
                <input
                  required
                  min="0"
                  step="0.1"
                  type="number"
                  name="capacity"
                  className="form-input"
                  placeholder="0"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Location
                <input
                  required
                  name="location"
                  className="form-input"
                  placeholder="Region, country"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Status
                <select required name="status" className="form-input">
                  <option>Screening</option>
                  <option>In progress</option>
                  <option>On hold</option>
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Save project
              </button>
            </div>
          </form>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="metric-card">
            <p className="metric-label">Projects</p>
            <p className="metric-value">{projects.length}</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Total capacity</p>
            <p className="metric-value">
              {projects.reduce((total, project) => total + project.capacity, 0)}{" "}
              <span className="text-lg font-medium text-slate-500">MW</span>
            </p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Ready for assessment</p>
            <p className="metric-value">
              {projects.filter((project) => project.status === "Screening").length}
            </p>
          </div>
        </section>

        <section className="mt-10 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-semibold">Portfolio projects</h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a project later to explore its connection pathways.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Project</th>
                  <th className="px-6 py-4 font-medium">Technology</th>
                  <th className="px-6 py-4 font-medium">Capacity</th>
                  <th className="px-6 py-4 font-medium">Location</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((project) => (
                  <tr key={project.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-5 font-semibold">{project.name}</td>
                    <td className="px-6 py-5 text-slate-600">{project.technology}</td>
                    <td className="px-6 py-5 text-slate-600">{project.capacity} MW</td>
                    <td className="px-6 py-5 text-slate-600">{project.location}</td>
                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[project.status]}`}
                      >
                        {project.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
