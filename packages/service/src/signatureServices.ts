export type VerifySignToken = {
  avatarUrl?: string | null;
  userId: string;
  isMultiUser?: boolean;
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  userName?: string | null;
  geolocation?: {
    location?: {
      latitude: number;
      longitude: number;
    };
    address?: {
      country: string;
      city: string;
      subregion: string;
      region: string;
    };
  };
};
