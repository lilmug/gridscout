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

function localAssumptions(): Assumptions {
  try {
    const cables = JSON.parse(localStorage.getItem(CABLE_ASSUMPTIONS_KEY) ?? "null") as CableAssumption[] | null;
    const quoteParts = JSON.parse(localStorage.getItem(QUOTE_PARTS_KEY) ?? "null") as RegionalQuotePart[] | null;
    return {
      cables: Array.isArray(cables) ? cables : defaultCableAssumptions,
      quoteParts: Array.isArray(quoteParts) ? quoteParts : defaultRegionalQuoteParts,
    };
  } catch (error) {
    console.error("Unable to read local assumptions fallback.", error);
    return { cables: defaultCableAssumptions, quoteParts: defaultRegionalQuoteParts };
  }
}

export async function loadAssumptions(): Promise<Assumptions> {
  try {
    const response = await fetch("/api/assumptions", { cache: "no-store" });
    if (!response.ok) throw new Error(`Assumptions request failed (${response.status})`);
    return await response.json() as Assumptions;
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
