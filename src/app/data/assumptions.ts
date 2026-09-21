export type CableAssumption = {
  id: string;
  label: string;
  material: "Aluminium" | "Cuivre";
  sectionMm2: 95 | 150 | 240 | 300 | 400;
  ruralCostPerKm: number;
  urbanCostPerKm: number;
};

export type RegionalQuotePart = {
  region: string;
  quotePartPerMw: number;
};

const cableSections = [95, 150, 240, 300, 400] as const;
const cableMaterials = [
  { key: "alu", label: "Aluminium", value: "Aluminium" as const },
  { key: "cu", label: "Cuivre", value: "Cuivre" as const },
];

export const defaultCableAssumptions: CableAssumption[] = cableMaterials.flatMap(
  ({ key, label, value: material }) =>
    cableSections.map((sectionMm2) => ({
      id: `mt-${key}-${sectionMm2}`,
      label: `MT ${sectionMm2} mm² ${label}`,
      material,
      sectionMm2,
      ruralCostPerKm: 0,
      urbanCostPerKm: 0,
    })),
);

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
