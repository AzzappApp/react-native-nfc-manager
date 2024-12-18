import { Image } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { createImageFromNativeTexture } from '#helpers/mediaEditions';
import type { TextureInfo } from '#helpers/mediaEditions/NativeTextureLoader';
import type {
  SkiaProps,
  DrawingNodeProps,
  RectDef,
  Fit,
} from '@shopify/react-native-skia';

type DeferredSkImageRendererProps = SkiaProps<
  DrawingNodeProps &
    RectDef & {
      fit?: Fit;
      textureInfo: TextureInfo | null;
    }
>;

const TextureImage = ({
  textureInfo,
  ...props
}: DeferredSkImageRendererProps) => {
  const skImage = useDerivedValue(() => {
    const textureInfoValue =
      textureInfo == null
        ? null
        : 'value' in textureInfo
          ? textureInfo.value
          : textureInfo;

    return textureInfoValue
      ? createImageFromNativeTexture(textureInfoValue)
      : null;
  });

  return <Image {...props} image={skImage} />;
};

export default TextureImage;
