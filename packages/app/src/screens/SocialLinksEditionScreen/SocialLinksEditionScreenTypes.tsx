export type SocialLinksEditionValue = {
  links?: readonly SocialLink[];
  iconSize: number;
  iconColor: string;
  arrangement: 'inline' | 'multiline';
  borderWidth?: number;
  columnGap?: number;
  marginTop?: number;
  marginBottom?: number;
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

export type SocialLink = { socialId: string; link: string; position: number };
