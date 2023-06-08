import type { CountryCode } from 'libphonenumber-js';

export type SimpleButtonEditionValue = {
  buttonLabel?: string;
  actionType?: CountryCode | 'email' | 'link';
  actionLink?: string;
  fontFamily: string;
  fontColor: string;
  fontSize: number;
  buttonColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  marginTop: number;
  marginBottom: number;
  width: number;
  height: number;
  background?: {
    id: string;
    uri: string;
  } | null;
  backgroundStyle?: {
    backgroundColor: string;
    patternColor: string;
    opacity: number;
  } | null;
};
