export type SocialLinksEditionValue = {
  links?: readonly SocialLink[];
  iconSize: number;
  iconColor: string;
  arrangement: 'inline' | 'multiline';
  borderWidth?: number;
  columnGap?: number;
  marginTop?: number;
  marginBottom?: number;
  marginHorizontal?: number;
  background?: {
    id: string;
    uri: string;
  } | null;
  backgroundStyle?: {
    backgroundColor: string;
    patternColor: string;
  } | null;
};

export type SocialLink = { socialId: string; link: string; position: number };
