import type { CoverEditorState } from '../coverEditorTypes';
import type { VideoFrame } from '@azzapp/react-native-skia-video';
import type { SkCanvas, SkShader } from '@shopify/react-native-skia';

export type CoverDrawerOptions = {
  canvas: SkCanvas;
  currentTime: number;
  width: number;
  height: number;
  coverEditorState: CoverEditorState;
  frames: Record<string, VideoFrame>;
  images: Record<string, bigint | null>;
  lutShaders: Record<string, SkShader>;
  videoScales: Record<string, number>;
};
