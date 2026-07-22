export type Coordinates = { latitude: number; longitude: number };

export type GeographicPlace = Coordinates & {
  provider: string; providerPlaceId: string; placeType: "city" | "town" | "village" | "census_designated_place";
  city: string; stateName: string; stateAbbr: string; population?: number;
};

export interface GeocoderProvider {
  readonly name: string;
  geocodeVerifiedAddress(address: string): Promise<Coordinates & { providerRequestId?: string }>;
}

export interface GeographyProvider {
  readonly name: string;
  placesNear(center: Coordinates, radiusMiles: number): Promise<GeographicPlace[]>;
}

class HttpGeographyProvider implements GeocoderProvider, GeographyProvider {
  readonly name: string;
  constructor(private readonly endpoint: string, private readonly apiKey: string) { this.name = new URL(endpoint).hostname; }
  async geocodeVerifiedAddress(address: string) {
    const response = await fetch(`${this.endpoint.replace(/\/$/, "")}/geocode`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` }, body: JSON.stringify({ address }), cache: "no-store", signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`Geocoder returned ${response.status}.`);
    const data = await response.json() as { latitude?: unknown; longitude?: unknown; providerRequestId?: unknown };
    if (typeof data.latitude !== "number" || typeof data.longitude !== "number") throw new Error("Geocoder returned invalid coordinates.");
    return { latitude: data.latitude, longitude: data.longitude, providerRequestId: typeof data.providerRequestId === "string" ? data.providerRequestId : undefined };
  }
  async placesNear(center: Coordinates, radiusMiles: number) {
    const response = await fetch(`${this.endpoint.replace(/\/$/, "")}/places`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` }, body: JSON.stringify({ ...center, radiusMiles, source: "us_census_places" }), cache: "no-store", signal: AbortSignal.timeout(45_000) });
    if (!response.ok) throw new Error(`Geography provider returned ${response.status}.`);
    const data = await response.json() as { places?: GeographicPlace[] };
    if (!Array.isArray(data.places)) throw new Error("Geography provider returned invalid places.");
    return data.places;
  }
}

export function getLocationProviders(): { geocoder: GeocoderProvider; geography: GeographyProvider } | null {
  const endpoint = process.env.GEOGRAPHY_PROVIDER_ENDPOINT; const apiKey = process.env.GEOGRAPHY_PROVIDER_API_KEY;
  if (!endpoint || !apiKey) return null;
  const provider = new HttpGeographyProvider(endpoint, apiKey);
  return { geocoder: provider, geography: provider };
}

