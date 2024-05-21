export type Customer = {
  email: string;
  name: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  countryCode: string;
  vatNumber?: string | null;
  phoneNumber?: string;
};
