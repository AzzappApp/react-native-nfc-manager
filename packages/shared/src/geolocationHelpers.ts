export type Geolocation = {
  location: { latitude: number; longitude: number };
  address?: {
    city: string;
    country: string;
    region: string;
    subregion: string;
  };
};
