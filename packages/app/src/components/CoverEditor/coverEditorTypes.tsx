import type { EditionParameters } from '#components/gpu';

import type {
  TextOrientation,
  TextPosition,
  TextStyle,
} from '@azzapp/shared/coverHelpers';

export type TemplateKind = 'others' | 'people' | 'video';

export type ColorPalette = {
  readonly id?: string | undefined;
  readonly primary: string;
  readonly dark: string;
  readonly light: string;
};

export type CoverStyleData = {
  titleStyle: TextStyle;
  subTitleStyle: TextStyle;
  textOrientation: TextOrientation;
  textPosition: TextPosition;
  mediaFilter: string | null;
  mediaParameters: EditionParameters;
  background: { id: string; uri: string } | null;
  backgroundColor: string | null;
  backgroundPatternColor: string | null;
  foreground: { id: string; uri: string } | null;
  foregroundColor: string | null;
  merged: boolean;
  segmented: boolean;
};
