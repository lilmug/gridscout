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

    return {
      cables: Array.isArray(storedCables) ? storedCables : defaultCableAssumptions,
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
