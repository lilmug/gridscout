export type ProjectStatus = "Screening" | "In progress" | "On hold";

export type GridCapexScenario = {
  id: string;
  name: string;
  distanceKm: number;
  connectionCapacityMw: number;
  cableId: string;
  connectionRegion: string;
  ruralPercentage: number;
  urbanPercentage: number;
  gridCapexEstimate?: number;
  selectedSubstationCode?: string;
};

export type Project = {
  id: number;
  name: string;
  technology: string;
  capacity: number;
  location: string;
  status: ProjectStatus;
  coordinates: [number, number];
  connectionRegion?: string;
  distanceToSubstationKm?: number;
  connectionCapacityMw?: number;
  cableType?: string;
  selectedSubstationCode?: string;
  developer?: string;
  department?: string;
  targetCommissioningDate?: string;
  gridVoltage?: string;
  landStatus?: string;
  notes?: string;
  gridCapexEstimate?: number;
  locationSelected?: boolean;
  scenarios?: GridCapexScenario[];
};

export const initialProjects: Project[] = [
  {
    id: 1,
    name: "North Ridge Solar",
    technology: "Solar PV",
    capacity: 48,
    location: "Occitanie, France",
    status: "Screening",
    coordinates: [43.6047, 1.4442],
    locationSelected: true,
  },
  {
    id: 2,
    name: "Green Valley Wind",
    technology: "Onshore wind",
    capacity: 72,
    location: "Brittany, France",
    status: "In progress",
    coordinates: [48.1173, -1.6778],
    locationSelected: true,
  },
];
