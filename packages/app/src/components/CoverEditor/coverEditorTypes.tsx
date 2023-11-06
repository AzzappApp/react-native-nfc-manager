import type { EditionParameters } from '#components/gpu';

import type {
  TextOrientation,
  TextPosition,
  TextStyle,
} from '@azzapp/shared/coverHelpers';

export type TemplateKind = 'others' | 'people' | 'video';

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

export type SourceMedia = {
  id?: string;
  uri: string;
  rawUri?: string;
  kind: 'image' | 'video';
  width: number;
  height: number;
};

export type MaskMedia = {
  id?: string;
  uri: string;
  source?: string;
};
