import { Image } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { createImageFromNativeBuffer } from '#helpers/mediaEditions';
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
      buffer: bigint | null;
    }
>;

const BufferImage = ({ buffer, ...props }: DeferredSkImageRendererProps) => {
  const skImage = useDerivedValue(() => {
    const bufValue =
      buffer == null
        ? null
        : typeof buffer === 'bigint'
          ? buffer
          : buffer.value;

    return createImageFromNativeBuffer(bufValue);
  });

  return <Image {...props} image={skImage} />;
};

export default BufferImage;
