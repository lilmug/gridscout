"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type { Project, ProjectStatus } from "@/app/data/projects";
import { loadAssumptions } from "@/app/data/assumptionStorage";
import { frenchRegions } from "@/app/data/regions";
import { loadProjects, saveProject as persistProject } from "@/app/data/projectStorage";
import ProjectMap, { type RteSubstation } from "./ProjectMap";

const euro = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

type ProjectDetailProps = { initialProject: Project };

export default function ProjectDetail({ initialProject }: ProjectDetailProps) {
  const [project, setProject] = useState(initialProject);
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [distance, setDistance] = useState(project.distanceToSubstationKm ?? 0);
  const [connectionCapacity, setConnectionCapacity] = useState(
    project.connectionCapacityMw ?? project.capacity,
  );
  const [cableType, setCableType] = useState(project.cableType ?? "hvac");
  const [region, setRegion] = useState(project.connectionRegion ?? "");
  const [coordinates, setCoordinates] = useState(project.coordinates);
  const [hasProjectLocation, setHasProjectLocation] = useState(
    project.locationSelected ?? false,
  );
  const [selectedSubstation, setSelectedSubstation] = useState<RteSubstation | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [routeStatus, setRouteStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [routeError, setRouteError] = useState("");
  const [cables] = useState(() => loadAssumptions().cables);
  const [quoteParts] = useState(() => loadAssumptions().quoteParts);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // The browser storage is loaded after hydration so the server-rendered shell stays stable.
    const stored = loadProjects().find((item) => item.id === initialProject.id);
    if (stored) {
      setProject(stored);
      setCoordinates(stored.coordinates);
      setDistance(stored.distanceToSubstationKm ?? 0);
      setConnectionCapacity(stored.connectionCapacityMw ?? stored.capacity);
      setCableType(stored.cableType ?? "hvac");
      setRegion(stored.connectionRegion ?? "");
    }
  }, [initialProject.id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const selectedCable = cables.find((cable) => cable.id === cableType);
  const selectedQuotePart = quoteParts.find((item) => item.region === region);
  const quotePartCost = (selectedQuotePart?.quotePartPerMw ?? 0) * connectionCapacity;
  const cableCost = (selectedCable?.costPerKm ?? 0) * distance;
  const totalCapex = quotePartCost + cableCost;
  const assumptionsConfigured = Boolean(selectedQuotePart?.quotePartPerMw && selectedCable?.costPerKm);

  const handleLocationChange = useCallback((nextCoordinates: [number, number]) => {
    setCoordinates(nextCoordinates);
    setHasProjectLocation(true);
    setSelectedSubstation(null);
    setRouteCoordinates([]);
    setDistance(0);
    setRouteStatus("idle");
    setProject((current) => {
      const updated = {
        ...current,
        coordinates: nextCoordinates,
        locationSelected: true,
        distanceToSubstationKm: undefined,
        selectedSubstationCode: undefined,
        gridCapexEstimate: undefined,
      };
      persistProject(updated);
      return updated;
    });
  }, []);

  const handleSubstationSelect = useCallback((substation: RteSubstation) => {
    setSelectedSubstation(substation);
    setRegion("Grand Est");
    setRouteStatus("loading");
    setRouteError("");
  }, []);

  useEffect(() => {
    if (!selectedSubstation) return;
    const controller = new AbortController();
    const [projectLat, projectLon] = coordinates;
    const [substationLat, substationLon] = selectedSubstation.coordinates;
    fetch(
      `https://router.project-osrm.org/route/v1/driving/${projectLon},${projectLat};${substationLon},${substationLat}?overview=full&geometries=geojson`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error(`Routing request failed (${response.status})`);
        return response.json();
      })
      .then((data: { routes?: Array<{ distance: number; geometry: { coordinates: [number, number][] } }> }) => {
        const route = data.routes?.[0];
        if (!route) throw new Error("No drivable route was found.");
        setDistance(Number((route.distance / 1000).toFixed(1)));
        setRouteCoordinates(route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]));
        setProject((current) => ({
          ...current,
          coordinates,
          locationSelected: true,
          distanceToSubstationKm: Number((route.distance / 1000).toFixed(1)),
          selectedSubstationCode: selectedSubstation.code,
          connectionRegion: "Grand Est",
          gridCapexEstimate:
            (selectedQuotePart?.quotePartPerMw ?? 0) * connectionCapacity +
            (selectedCable?.costPerKm ?? 0) * Number((route.distance / 1000).toFixed(1)),
        }));
        persistProject({
          ...project,
          coordinates,
          locationSelected: true,
          distanceToSubstationKm: Number((route.distance / 1000).toFixed(1)),
          selectedSubstationCode: selectedSubstation.code,
          connectionRegion: "Grand Est",
          gridCapexEstimate:
            (selectedQuotePart?.quotePartPerMw ?? 0) * connectionCapacity +
            (selectedCable?.costPerKm ?? 0) * Number((route.distance / 1000).toFixed(1)),
        });
        setRouteStatus("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Unable to calculate the road route.", error);
        setRouteStatus("error");
        setRouteError("Impossible de calculer un itinéraire routier pour cette sélection.");
      });
    return () => controller.abort();
  // Route inputs intentionally define this request; project state is persisted inside it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinates, selectedSubstation]);

  function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updated = {
      ...project,
      name: String(formData.get("name")),
      technology: String(formData.get("technology")),
      capacity: Number(formData.get("capacity")),
      location: String(formData.get("location")),
      status: String(formData.get("status")) as ProjectStatus,
      connectionRegion: String(formData.get("connectionRegion")),
      developer: String(formData.get("developer")),
      department: String(formData.get("department")),
      targetCommissioningDate: String(formData.get("targetCommissioningDate")),
      gridVoltage: String(formData.get("gridVoltage")),
      landStatus: String(formData.get("landStatus")),
      notes: String(formData.get("notes")),
    };
    setProject(updated);
    setRegion(updated.connectionRegion);
    persistProject(updated);
    setIsEditing(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <main className="min-h-screen bg-[#f5f7f6] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <Link href="/" className="text-xl font-semibold tracking-tight text-emerald-950">GridScout</Link>
          <Link href="/admin" className="text-sm font-medium text-slate-600 hover:text-emerald-700">Admin assumptions</Link>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <Link href="/" className="text-sm font-medium text-emerald-700 hover:text-emerald-900">← Back to projects</Link>
        <div className="mt-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-sm font-medium text-emerald-700">Project detail</p>
            <h1 className="text-4xl font-semibold tracking-tight">{project.name}</h1>
            <p className="mt-2 text-slate-600">{project.location}</p>
          </div>
          <button type="button" onClick={() => setIsEditing((value) => !value)} className="rounded-lg bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
            {isEditing ? "Close editor" : "Edit project"}
          </button>
        </div>

        {saved && <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Project details saved for this session.</p>}

        {isEditing && (
          <form onSubmit={saveProject} className="mt-6 rounded-xl border border-emerald-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Edit project information</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <label className="text-sm font-medium text-slate-700">Project name<input required name="name" defaultValue={project.name} className="form-input" /></label>
              <label className="text-sm font-medium text-slate-700">Technology<select name="technology" defaultValue={project.technology} className="form-input"><option>Solar PV</option><option>Onshore wind</option><option>Battery storage</option><option>Hydro</option></select></label>
              <label className="text-sm font-medium text-slate-700">Capacity (MW)<input required min="0" step="0.1" type="number" name="capacity" defaultValue={project.capacity} className="form-input" /></label>
              <label className="text-sm font-medium text-slate-700">Location<input required name="location" defaultValue={project.location} className="form-input" /></label>
              <label className="text-sm font-medium text-slate-700">French region<select required name="connectionRegion" defaultValue={project.connectionRegion ?? ""} className="form-input"><option value="">Select region</option>{frenchRegions.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="text-sm font-medium text-slate-700">Developer<input name="developer" defaultValue={project.developer ?? ""} className="form-input" /></label>
              <label className="text-sm font-medium text-slate-700">Department<input name="department" defaultValue={project.department ?? ""} className="form-input" /></label>
              <label className="text-sm font-medium text-slate-700">Target commissioning<input type="date" name="targetCommissioningDate" defaultValue={project.targetCommissioningDate ?? ""} className="form-input" /></label>
              <label className="text-sm font-medium text-slate-700">Grid voltage<input name="gridVoltage" defaultValue={project.gridVoltage ?? ""} placeholder="e.g. 63 kV" className="form-input" /></label>
              <label className="text-sm font-medium text-slate-700">Land status<select name="landStatus" defaultValue={project.landStatus ?? ""} className="form-input"><option value="">Select status</option><option>Secured</option><option>Under option</option><option>To be secured</option></select></label>
              <label className="text-sm font-medium text-slate-700">Status<select name="status" defaultValue={project.status} className="form-input"><option>Screening</option><option>In progress</option><option>On hold</option></select></label>
              <label className="text-sm font-medium text-slate-700 md:col-span-2 lg:col-span-4">Notes<textarea name="notes" defaultValue={project.notes ?? ""} className="form-input min-h-24" /></label>
            </div>
            <button type="submit" className="mt-6 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Save project</button>
          </form>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5"><h2 className="font-semibold">Location and grid context</h2><p className="mt-1 text-sm text-slate-500">Grand Est RTE substations are shown in blue. Select a location and a substation to calculate the road route.</p></div>
            <ProjectMap name={project.name} technology={project.technology} coordinates={coordinates} hasProjectLocation={hasProjectLocation} selectedSubstationCode={selectedSubstation?.code} onLocationChange={handleLocationChange} onSubstationSelect={handleSubstationSelect} routeCoordinates={routeCoordinates} />
          </section>
          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold">Project summary</h2>
            <dl className="mt-5 divide-y divide-slate-100 text-sm">
              <div className="flex justify-between py-3"><dt className="text-slate-500">Technology</dt><dd className="font-medium">{project.technology}</dd></div>
              <div className="flex justify-between py-3"><dt className="text-slate-500">Capacity</dt><dd className="font-medium">{project.capacity} MW</dd></div>
              <div className="flex justify-between py-3"><dt className="text-slate-500">Selected RTE post</dt><dd className="max-w-[150px] text-right font-medium">{selectedSubstation?.name ?? "Not selected"}</dd></div>
              <div className="flex justify-between py-3"><dt className="text-slate-500">Road distance</dt><dd className="font-medium">{distance > 0 ? `${distance} km` : "Not calculated"}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-slate-500">Coordinates</dt><dd className="text-right font-medium">{coordinates[1].toFixed(5)}, {coordinates[0].toFixed(5)}</dd></div>
            </dl>
          </aside>
        </div>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start"><div><p className="text-sm font-medium text-emerald-700">Scenario model</p><h2 className="mt-1 text-2xl font-semibold">Grid connection CAPEX estimate</h2><p className="mt-2 text-sm text-slate-500">Quote-part × connection capacity + cable cost per km × distance to substation.</p></div><div className="rounded-lg bg-slate-950 px-5 py-4 text-white"><p className="text-xs uppercase tracking-wide text-slate-300">Estimated CAPEX</p><p className="mt-1 text-2xl font-semibold">{euro.format(totalCapex)}</p></div></div>
          {!assumptionsConfigured && <p className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">Configure the selected region and cable cost in Admin before treating this estimate as meaningful.</p>}
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-medium text-slate-700">Connection region<select value={region} onChange={(event) => setRegion(event.target.value)} className="form-input"><option value="">Select region</option>{quoteParts.map((item) => <option key={item.region}>{item.region}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Distance to substation (km)<input type="number" min="0" step="0.1" value={distance} onChange={(event) => setDistance(Number(event.target.value))} className="form-input" /></label>
            <label className="text-sm font-medium text-slate-700">Capacity to connect (MW)<input type="number" min="0" step="0.1" value={connectionCapacity} onChange={(event) => setConnectionCapacity(Number(event.target.value))} className="form-input" /></label>
            <label className="text-sm font-medium text-slate-700">Cable type<select value={cableType} onChange={(event) => setCableType(event.target.value)} className="form-input">{cables.map((cable) => <option key={cable.id} value={cable.id}>{cable.label}</option>)}</select></label>
          </div>
          {selectedSubstation && <p className="mt-4 text-sm text-slate-600">Selected post: <strong>{selectedSubstation.name}</strong>{selectedSubstation.remainingCapacityMw !== null && ` · ${selectedSubstation.remainingCapacityMw} MW remaining capacity`}{routeStatus === "loading" && " · calculating road route…"}</p>}
          {routeStatus === "error" && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{routeError}</p>}
          <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 text-sm md:grid-cols-3"><div><p className="text-slate-500">Quote-part contribution</p><p className="mt-1 font-semibold">{euro.format(quotePartCost)}</p></div><div><p className="text-slate-500">Cable contribution</p><p className="mt-1 font-semibold">{euro.format(cableCost)}</p></div><div><p className="text-slate-500">Applied assumptions</p><p className="mt-1 font-semibold">{selectedQuotePart?.quotePartPerMw ?? 0} €/MW · {selectedCable?.costPerKm ?? 0} €/km</p></div></div>
        </section>
      </div>
    </main>
  );
}
