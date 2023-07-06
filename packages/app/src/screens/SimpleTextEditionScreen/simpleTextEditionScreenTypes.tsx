import type { TextAlignment } from '@azzapp/relay/artifacts/SimpleTextEditionScreen_module.graphql';

export type SimpleTextEditionValue = {
  text?: string | null | undefined;
  textAlign?: TextAlignment | undefined;
  color?: string | undefined;
  fontSize?: number | undefined;
  fontFamily?: string | undefined;
  verticalSpacing?: number | undefined;
  marginHorizontal?: number | undefined;
  marginVertical?: number | undefined;
  background?: {
    id: string;
    uri: string;
  } | null;
  backgroundStyle?: {
    backgroundColor: string;
    patternColor: string;
  } | null;
};
