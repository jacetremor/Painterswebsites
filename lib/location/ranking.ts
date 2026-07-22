import type { Coordinates, GeographicPlace } from "@/lib/location/provider";

export type LocationRankingInput = {
  center: Coordinates; businessState: string; servedStates: string[]; radiusMiles?: number; maximumPages?: number;
  confirmedCoverage: string[]; priorityLocations?: string[]; projectCities?: string[]; testimonialCities?: string[];
  crossStateEnabled?: boolean; novaApprovedCrossState?: string[];
};

export type RankedLocation = GeographicPlace & { distanceMiles: number; score: number; isPriority: boolean; isCrossState: boolean; projectCount: number; testimonialCount: number };

function normalized(value: string) { return value.trim().toLowerCase(); }

export function distanceMiles(a: Coordinates, b: Coordinates): number {
  const earthRadiusMiles = 3958.7613; const radians = (degrees: number) => degrees * Math.PI / 180;
  const latDelta = radians(b.latitude - a.latitude); const lonDelta = radians(b.longitude - a.longitude);
  const value = Math.sin(latDelta / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(lonDelta / 2) ** 2;
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function rankLocationCandidates(places: GeographicPlace[], input: LocationRankingInput): RankedLocation[] {
  const radius = input.radiusMiles ?? 30; const maximum = Math.min(20, Math.max(0, input.maximumPages ?? 20));
  const coverage = new Set(input.confirmedCoverage.map(normalized)); const priority = new Set((input.priorityLocations ?? []).map(normalized));
  const projects = (input.projectCities ?? []).map(normalized); const testimonials = (input.testimonialCities ?? []).map(normalized);
  const servedStates = new Set(input.servedStates.map((state) => state.toUpperCase())); const approvedCrossState = new Set((input.novaApprovedCrossState ?? []).map((state) => state.toUpperCase()));
  return places.flatMap((place): RankedLocation[] => {
    const city = normalized(place.city); const confirmed = coverage.has(city) || coverage.has(`${city}, ${place.stateAbbr.toLowerCase()}`);
    if (!confirmed) return [];
    const distance = distanceMiles(input.center, place); if (distance > radius) return [];
    const isCrossState = place.stateAbbr.toUpperCase() !== input.businessState.toUpperCase();
    if (isCrossState && (!input.crossStateEnabled || !servedStates.has(place.stateAbbr.toUpperCase()) || !approvedCrossState.has(place.stateAbbr.toUpperCase()))) return [];
    const projectCount = projects.filter((item) => item === city).length; const testimonialCount = testimonials.filter((item) => item === city).length; const isPriority = priority.has(city);
    const populationScore = Math.log10(Math.max(1, place.population ?? 1));
    const score = 1000 + (isPriority ? 300 : 0) + Math.max(0, radius - distance) * 4 + populationScore * 8 + projectCount * 35 + testimonialCount * 20;
    return [{ ...place, distanceMiles: Number(distance.toFixed(2)), score: Number(score.toFixed(4)), isPriority, isCrossState, projectCount, testimonialCount }];
  }).sort((a, b) => b.score - a.score || a.distanceMiles - b.distanceMiles || a.city.localeCompare(b.city)).slice(0, maximum);
}

