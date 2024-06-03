import type { CoverEditorState } from '../coverEditorTypes';
import type { VideoFrame } from '@azzapp/react-native-skia-video';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';
import type {
  SkCanvas,
  SkImage,
  SkShader,
  SkTypefaceFontProvider,
} from '@shopify/react-native-skia';

export type CoverDrawerOptions = {
  canvas: SkCanvas;
  currentTime: number;
  width: number;
  height: number;
  coverEditorState: CoverEditorState;
  frames: Record<string, VideoFrame>;
  images: Record<string, SkImage | null>;
  lutShaders: Record<string, SkShader>;
  videoScales: Record<string, number>;
  fontManager: SkTypefaceFontProvider | null;
  cardColors: ColorPalette | null | undefined;
};
