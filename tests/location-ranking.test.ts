import { describe, expect, it } from "vitest";
import { distanceMiles, rankLocationCandidates } from "@/lib/location/ranking";
import type { GeographicPlace } from "@/lib/location/provider";

const places: GeographicPlace[] = [
  { provider: "census", providerPlaceId: "1", placeType: "city", city: "Priority", stateName: "Utah", stateAbbr: "UT", latitude: 40.1, longitude: -111.7, population: 5_000 },
  { provider: "census", providerPlaceId: "2", placeType: "city", city: "Large", stateName: "Utah", stateAbbr: "UT", latitude: 40.05, longitude: -111.7, population: 100_000 },
  { provider: "census", providerPlaceId: "3", placeType: "city", city: "Unconfirmed", stateName: "Utah", stateAbbr: "UT", latitude: 40.01, longitude: -111.7, population: 500_000 },
  { provider: "census", providerPlaceId: "4", placeType: "city", city: "Border", stateName: "Colorado", stateAbbr: "CO", latitude: 40.02, longitude: -111.7, population: 80_000 },
];

describe("location selection", () => {
  it("uses confirmed coverage as a hard gate and priority before population", () => {
    const ranked = rankLocationCandidates(places, { center: { latitude: 40, longitude: -111.7 }, businessState: "UT", servedStates: ["UT", "CO"], confirmedCoverage: ["Priority", "Large", "Border"], priorityLocations: ["Priority"], radiusMiles: 30, maximumPages: 20 });
    expect(ranked.map((item) => item.city)).toEqual(["Priority", "Large"]); expect(ranked.some((item) => item.city === "Unconfirmed")).toBe(false); expect(ranked.some((item) => item.city === "Border")).toBe(false);
  });

  it("requires both client and Nova Suite cross-state approval", () => {
    const ranked = rankLocationCandidates(places, { center: { latitude: 40, longitude: -111.7 }, businessState: "UT", servedStates: ["UT", "CO"], confirmedCoverage: ["Border"], crossStateEnabled: true, novaApprovedCrossState: ["CO"], radiusMiles: 30 });
    expect(ranked.map((item) => item.city)).toContain("Border"); expect(distanceMiles({ latitude: 40, longitude: -111.7 }, { latitude: 40, longitude: -111.7 })).toBe(0);
  });
});

