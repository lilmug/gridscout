"use client";

import { useEffect, useRef, useState } from "react";
import type {
  CircleMarker,
  Map as LeafletMap,
  Marker,
  Polyline,
} from "leaflet";

export type RteSubstation = {
  name: string;
  code: string;
  coordinates: [number, number];
  capacityMw: number | null;
  remainingCapacityMw: number | null;
  quotePartPerMw: number | null;
};

type ProjectMapProps = {
  name: string;
  technology: string;
  coordinates: [number, number];
  hasProjectLocation: boolean;
  selectedSubstationCode?: string;
  onLocationChange: (coordinates: [number, number]) => void;
  onSubstationSelect: (substation: RteSubstation) => void;
  routeCoordinates?: [number, number][];
};

function parseQuotePart(value: string | undefined) {
  if (!value) return null;
  const match = value.replace(",", ".").match(/[\d.]+/);
  return match ? Number(match[0]) * 1000 : null;
}

function parseMegawatts(value: string | number | undefined) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(String(value).replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function getCapacityStyle(remainingCapacityMw: number | null, selected: boolean) {
  if (selected) {
    return { color: "#be123c", fillColor: "#fb7185" };
  }
  if (remainingCapacityMw === null) {
    return { color: "#64748b", fillColor: "#cbd5e1" };
  }
  if (remainingCapacityMw >= 100) {
    return { color: "#15803d", fillColor: "#4ade80" };
  }
  if (remainingCapacityMw >= 20) {
    return { color: "#a16207", fillColor: "#facc15" };
  }
  return { color: "#b91c1c", fillColor: "#f87171" };
}

function getTechnologyIcon(technology: string) {
  if (technology.toLowerCase().includes("wind")) return "🌬️";
  if (technology.toLowerCase().includes("battery")) return "🔋";
  if (technology.toLowerCase().includes("hydro")) return "💧";
  return "☀️";
}

export default function ProjectMap({
  name,
  technology,
  coordinates,
  hasProjectLocation,
  selectedSubstationCode,
  onLocationChange,
  onSubstationSelect,
  routeCoordinates = [],
}: ProjectMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const projectMarker = useRef<Marker | null>(null);
  const substationMarkers = useRef<CircleMarker[]>([]);
  const routeLine = useRef<Polyline | null>(null);
  const [substations, setSubstations] = useState<RteSubstation[]>([]);
  const [selectionMode, setSelectionMode] = useState<"location" | "substation">(
    "substation",
  );
  const selectionModeRef = useRef(selectionMode);
  const initialCoordinates = useRef(coordinates);
  const initialHasProjectLocation = useRef(hasProjectLocation);

  useEffect(() => {
    selectionModeRef.current = selectionMode;
  }, [selectionMode]);

  useEffect(() => {
    fetch("/data/grandest.json")
      .then(async (response) => {
        if (!response.ok) throw new Error(`RTE data request failed (${response.status})`);
        return response.json();
      })
      .then((data: Array<Record<string, unknown>>) => {
        setSubstations(
          data
            .filter((item) => typeof item.X === "number" && typeof item.Y === "number")
            .map((item) => ({
              name: String(item.name ?? "Unnamed substation"),
              code: String(item.code ?? item.name ?? "unknown"),
              coordinates: [Number(item.Y), Number(item.X)],
              capacityMw: parseMegawatts(item.u_max as string | number | undefined),
              remainingCapacityMw: parseMegawatts(
                (item.values as Record<string, string> | undefined)?.INFO_CR,
              ),
              quotePartPerMw: parseQuotePart(
                (item.values as Record<string, string> | undefined)?.INFO_QP,
              ),
            })),
        );
      })
      .catch((error: unknown) => {
        console.error("Unable to load Grand Est RTE substations.", error);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initialiseMap() {
      const leaflet = await import("leaflet");
      if (cancelled || !mapElement.current || map.current) return;
      map.current = leaflet
        .map(mapElement.current)
        .setView(
          initialHasProjectLocation.current ? initialCoordinates.current : [46.6, 2.2],
          initialHasProjectLocation.current ? 10 : 6,
        );
      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        })
        .addTo(map.current);
      map.current.on("click", (event) => {
        if (selectionModeRef.current === "location") {
          onLocationChange([event.latlng.lat, event.latlng.lng]);
        }
      });
    }
    initialiseMap();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, [onLocationChange]);

  useEffect(() => {
    let cancelled = false;
    async function updateLayers() {
      const leaflet = await import("leaflet");
      if (cancelled || !map.current) return;

      projectMarker.current?.remove();
      substationMarkers.current.forEach((marker) => marker.remove());
      routeLine.current?.remove();

      projectMarker.current = leaflet
        .marker(coordinates, {
          icon: leaflet.divIcon({
            className: "project-technology-icon",
            html: `<span role="img" aria-label="${technology}">${getTechnologyIcon(technology)}</span>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
          }),
        })
        .addTo(map.current)
        .bindPopup(`<strong>${name}</strong><br />Project location`);

      substationMarkers.current = substations.map((substation) => {
        const selected = substation.code === selectedSubstationCode;
        const capacityStyle = getCapacityStyle(
          substation.remainingCapacityMw,
          selected,
        );
        const marker = leaflet
          .circleMarker(substation.coordinates, {
            radius: selected ? 9 : 6,
            color: capacityStyle.color,
            fillColor: capacityStyle.fillColor,
            fillOpacity: 0.85,
          })
          .addTo(map.current!);
        marker.bindTooltip(
          `${substation.name} (${substation.code}) · capacité restante : ${
            substation.remainingCapacityMw === null
              ? "inconnue"
              : `${substation.remainingCapacityMw} MW`
          }`,
        );
        marker.on("click", () => onSubstationSelect(substation));
        return marker;
      });

      if (routeCoordinates.length > 1) {
        routeLine.current = leaflet
          .polyline(routeCoordinates, { color: "#047857", weight: 5, opacity: 0.8 })
          .addTo(map.current);
      }
    }
    updateLayers();
    return () => {
      cancelled = true;
    };
  }, [
    coordinates,
    name,
    onSubstationSelect,
    routeCoordinates,
    selectedSubstationCode,
    substations,
    technology,
  ]);

  function focusRoute() {
    if (!map.current || routeCoordinates.length < 2) return;
    import("leaflet").then((leaflet) => {
      if (!map.current) return;
      map.current.fitBounds(leaflet.latLngBounds(routeCoordinates), {
        padding: [40, 40],
        maxZoom: 12,
      });
    });
  }

  return (
    <div className="relative">
      <div ref={mapElement} className="h-[520px] w-full" aria-label={`Map showing ${name}`} />
      <div className="absolute left-4 right-4 top-4 z-[1000] flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectionMode("location")}
          className={`rounded-lg px-3 py-2 text-xs font-semibold shadow ${
            selectionMode === "location"
              ? "bg-emerald-800 text-white"
              : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          1. Choisir la localisation
        </button>
        <button
          type="button"
          onClick={() => setSelectionMode("substation")}
          className={`rounded-lg px-3 py-2 text-xs font-semibold shadow ${
            selectionMode === "substation"
              ? "bg-blue-700 text-white"
              : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          2. Choisir un poste RTE
        </button>
        {routeCoordinates.length > 1 && (
          <button
            type="button"
            onClick={focusRoute}
            className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-emerald-800 shadow hover:bg-emerald-50"
          >
            Voir l’itinéraire
          </button>
        )}
      </div>
      <div className="absolute bottom-4 left-4 z-[1000] rounded-lg bg-white/95 px-3 py-2 text-xs text-slate-600 shadow">
        {selectionMode === "location"
          ? "Cliquez sur la carte pour déplacer le projet."
          : "Cliquez sur un marqueur bleu pour sélectionner un poste RTE."}
      </div>
      <div className="absolute bottom-4 right-4 z-[1000] rounded-lg bg-white/95 p-3 text-xs text-slate-700 shadow">
        <p className="mb-2 font-semibold">Capacité restante (INFO_CR)</p>
        <div className="space-y-1.5">
          <div><span className="legend-dot bg-green-400" /> ≥ 100 MW</div>
          <div><span className="legend-dot bg-yellow-400" /> 20–99 MW</div>
          <div><span className="legend-dot bg-red-400" /> &lt; 20 MW</div>
          <div><span className="legend-dot bg-slate-300" /> Inconnue</div>
        </div>
      </div>
    </div>
  );
}
