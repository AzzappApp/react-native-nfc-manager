import { memo, useState } from 'react';
import {
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
} from 'react-native-reanimated';
import { MAX_VIDEO_THUMBNAIL_SIZE } from '#components/ImagePicker/ImagePickerContext';
import TransformedImageRenderer from '#components/TransformedImageRenderer';
import TransformedVideoRenderer from '#components/TransformedVideoRenderer';
import {
  createImageFromNativeBuffer,
  scaleCropDataIfNecessary,
  useNativeBuffer,
} from '#helpers/mediaEditions';
import {
  CARD_MEDIA_VIDEO_DEFAULT_DURATION,
  MAX_IMAGE_CARD_MODULE_PREVIEW_SIZE,
} from './cardModuleEditorType';
import type { CardModuleSourceMedia } from './cardModuleEditorType';

type CardModuleMediaEditPreviewProps = {
  media: CardModuleSourceMedia;
  itemWidth: number;
  itemHeight: number;
};

const CardModuleMediaEditPreview = ({
  media,
  itemWidth,
  itemHeight,
}: CardModuleMediaEditPreviewProps) => {
  const { cropData, ...editionParameters } = media.editionParameters ?? {};

  if (!media) {
    return null;
  }

  return media.kind === 'video' ? (
    <TransformedVideoRenderer
      testID="card-module-media-edit-preview-video"
      video={media}
      width={itemWidth}
      height={itemHeight}
      filter={media.filter}
      editionParameters={{
        ...editionParameters,
        cropData,
      }}
      startTime={media.timeRange?.startTime ?? 0}
      duration={media.timeRange?.duration ?? CARD_MEDIA_VIDEO_DEFAULT_DURATION}
      maxResolution={itemWidth * 2}
    />
  ) : (
    <ImageRender media={media} itemWidth={itemWidth} itemHeight={itemHeight} />
  );
};

const ImageRender = ({
  media,
  itemWidth,
  itemHeight,
}: {
  media: CardModuleSourceMedia;
  itemWidth: number;
  itemHeight: number;
}) => {
  const { cropData, ...editionParameters } = media.editionParameters ?? {};
  const nativeBuffer = useNativeBuffer({
    uri: media.uri,
    kind: media.kind,
    time: media?.kind === 'video' ? media.timeRange?.startTime : null,
    maxSize:
      media?.kind === 'video'
        ? MAX_VIDEO_THUMBNAIL_SIZE
        : MAX_IMAGE_CARD_MODULE_PREVIEW_SIZE,
  });
  const skImage = useDerivedValue(() => {
    if (!nativeBuffer) {
      return null;
    }
    return createImageFromNativeBuffer(nativeBuffer);
  }, [nativeBuffer]);

  const [skImageWidth, setSkImageWidth] = useState<number | null>(null);

  useAnimatedReaction(
    () => skImage.value,
    skImage => {
      if (skImage) {
        runOnJS(setSkImageWidth)(skImage.width());
      } else {
        runOnJS(setSkImageWidth)(null);
      }
    },
  );

  if (!media || !skImage || !nativeBuffer) {
    return null;
  }

  return (
    <TransformedImageRenderer
      testID="card-module-media-edit-preview-image"
      image={skImage}
      width={itemWidth}
      height={itemHeight}
      filter={media.filter}
      editionParameters={{
        ...editionParameters,
        cropData: cropData
          ? scaleCropDataIfNecessary(cropData, media, skImageWidth)
          : null,
      }}
    />
  );
};

export default memo(CardModuleMediaEditPreview);
