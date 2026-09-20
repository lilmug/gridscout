export type CableAssumption = {
  id: string;
  label: string;
  costPerKm: number;
};

export type RegionalQuotePart = {
  region: string;
  quotePartPerMw: number;
};

export const defaultCableAssumptions: CableAssumption[] = [
  { id: "hvac", label: "HVAC overhead line", costPerKm: 0 },
  { id: "hvac-underground", label: "HVAC underground cable", costPerKm: 0 },
  { id: "hvdc", label: "HVDC cable", costPerKm: 0 },
];

export const defaultRegionalQuoteParts: RegionalQuotePart[] = [
  "Auvergne-Rhône-Alpes",
  "Bourgogne-Franche-Comté",
  "Bretagne",
  "Centre-Val de Loire",
  "Corse",
  "Grand Est",
  "Hauts-de-France",
  "Île-de-France",
  "Normandie",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Pays de la Loire",
  "Provence-Alpes-Côte d'Azur",
].map((region) => ({ region, quotePartPerMw: 0 }));
