import {
  defaultCableAssumptions,
  defaultRegionalQuoteParts,
  type CableAssumption,
  type RegionalQuotePart,
} from "./assumptions";

export const CABLE_ASSUMPTIONS_KEY = "gridscout-cable-assumptions";
export const QUOTE_PARTS_KEY = "gridscout-quote-parts";

export function loadAssumptions() {
  if (typeof window === "undefined") {
    return {
      cables: defaultCableAssumptions,
      quoteParts: defaultRegionalQuoteParts,
    };
  }

  try {
    const storedCables = JSON.parse(
      window.localStorage.getItem(CABLE_ASSUMPTIONS_KEY) ?? "null",
    ) as CableAssumption[] | null;
    const storedQuoteParts = JSON.parse(
      window.localStorage.getItem(QUOTE_PARTS_KEY) ?? "null",
    ) as RegionalQuotePart[] | null;

    const cables = Array.isArray(storedCables)
      ? defaultCableAssumptions.map((fallback) => {
          const stored = storedCables.find((item) => item.id === fallback.id);
          if (!stored) return fallback;
          const legacyCost = (stored as CableAssumption & { costPerKm?: number }).costPerKm;
          return {
            ...fallback,
            ruralCostPerKm: stored.ruralCostPerKm ?? legacyCost ?? fallback.ruralCostPerKm,
            urbanCostPerKm: stored.urbanCostPerKm ?? legacyCost ?? fallback.urbanCostPerKm,
          };
        })
      : defaultCableAssumptions;
    return {
      cables,
      quoteParts: Array.isArray(storedQuoteParts) ? storedQuoteParts : defaultRegionalQuoteParts,
    };
  } catch (error) {
    console.error("Unable to load CAPEX assumptions from local storage.", error);
    return {
      cables: defaultCableAssumptions,
      quoteParts: defaultRegionalQuoteParts,
    };
  }
}
