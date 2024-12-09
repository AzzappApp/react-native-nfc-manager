import type { TextureInfo } from '#helpers/mediaEditions/NativeTextureLoader';
import type { CoverEditorState } from '../coverEditorTypes';
import type {
  VideoComposition,
  VideoFrame,
} from '@azzapp/react-native-skia-video';
import type { LottieInfo } from '@azzapp/shared/lottieHelpers';
import type { SkCanvas, SkShader } from '@shopify/react-native-skia';
import type { SkottieTemplatePlayer } from 'react-native-skottie-template-player';

export type CoverDrawerOptions = {
  canvas: SkCanvas;
  videoComposition: VideoComposition;
  currentTime: number;
  width: number;
  height: number;
  coverEditorState: CoverEditorState;
  frames: Record<string, VideoFrame>;
  images: Record<string, TextureInfo>;
  lutShaders: Record<string, SkShader>;
  videoScales: Record<string, number>;
  skottiePlayer?: SkottieTemplatePlayer | null;
  lottieInfo?: LottieInfo;
};
