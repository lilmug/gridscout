import {
  defaultCableAssumptions,
  defaultRegionalQuoteParts,
  type CableAssumption,
  type RegionalQuotePart,
} from "./assumptions";

export const CABLE_ASSUMPTIONS_KEY = "gridscout-cable-assumptions";
export const QUOTE_PARTS_KEY = "gridscout-quote-parts";

export type Assumptions = {
  cables: CableAssumption[];
  quoteParts: RegionalQuotePart[];
};

function normalizeAssumptions(data: Partial<Assumptions>): Assumptions {
  return {
    cables: defaultCableAssumptions.map((fallback) => {
      const stored = data.cables?.find((item) => item.id === fallback.id);
      const legacyCost = stored && "costPerKm" in stored
        ? Number((stored as CableAssumption & { costPerKm?: number }).costPerKm)
        : undefined;
      return stored
        ? { ...fallback, ruralCostPerKm: stored.ruralCostPerKm ?? legacyCost ?? fallback.ruralCostPerKm }
        : fallback;
    }),
    quoteParts: Array.isArray(data.quoteParts) ? data.quoteParts : defaultRegionalQuoteParts,
  };
}

function localAssumptions(): Assumptions {
  try {
    const cables = JSON.parse(localStorage.getItem(CABLE_ASSUMPTIONS_KEY) ?? "null") as CableAssumption[] | null;
    const quoteParts = JSON.parse(localStorage.getItem(QUOTE_PARTS_KEY) ?? "null") as RegionalQuotePart[] | null;
    return normalizeAssumptions({ cables: Array.isArray(cables) ? cables : undefined, quoteParts });
  } catch (error) {
    console.error("Unable to read local assumptions fallback.", error);
    return { cables: defaultCableAssumptions, quoteParts: defaultRegionalQuoteParts };
  }
}

export async function loadAssumptions(): Promise<Assumptions> {
  try {
    const response = await fetch("/api/assumptions", { cache: "no-store" });
    if (!response.ok) throw new Error(`Assumptions request failed (${response.status})`);
    return normalizeAssumptions(await response.json() as Partial<Assumptions>);
  } catch (error) {
    console.error("Unable to load shared assumptions.", error);
    return typeof window === "undefined"
      ? { cables: defaultCableAssumptions, quoteParts: defaultRegionalQuoteParts }
      : localAssumptions();
  }
}

export async function saveAssumptions(assumptions: Assumptions) {
  const response = await fetch("/api/assumptions", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(assumptions),
  });
  if (!response.ok) throw new Error(`Assumptions save failed (${response.status})`);
}
