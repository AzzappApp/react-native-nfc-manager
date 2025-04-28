export type Geolocation = {
  location: { latitude: number; longitude: number } | null;
  address?: {
    city?: string | null;
    country?: string | null;
    region?: string | null;
    subregion?: string | null;
  } | null;
};
