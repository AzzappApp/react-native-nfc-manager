import { memo, useEffect, useState } from 'react';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
} from 'react-native-reanimated';
import { MAX_VIDEO_THUMBNAIL_SIZE } from '#components/ImagePicker/ImagePickerContext';
import TransformedImageRenderer from '#components/TransformedImageRenderer';
import TransformedVideoRenderer from '#components/TransformedVideoRenderer';
import {
  createImageFromNativeTexture,
  NativeTextureLoader,
  scaleCropDataIfNecessary,
} from '#helpers/mediaEditions';
import { copyCoverMediaToCacheDir } from '#helpers/mediaHelpers';
import {
  CARD_MEDIA_VIDEO_DEFAULT_DURATION,
  MAX_IMAGE_CARD_MODULE_PREVIEW_SIZE,
} from './cardModuleEditorType';
import type { TextureInfo } from '#helpers/mediaEditions/NativeTextureLoader';
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

  const [textureInfo, setTextureInfo] = useState<TextureInfo | null>(null);

  useEffect(() => {
    const canceled = false;
    const abortController = new AbortController();
    let refKey: string | null = null;
    (async () => {
      const cacheDir = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/modules`;
      const filename = await copyCoverMediaToCacheDir(
        media,
        cacheDir,
        abortController.signal,
      );

      const { key, promise } =
        media.kind === 'video'
          ? NativeTextureLoader.loadVideoThumbnail(
              `file://${cacheDir}/${filename}`,
              media.timeRange?.startTime,
              MAX_VIDEO_THUMBNAIL_SIZE,
            )
          : NativeTextureLoader.loadImage(
              `file://${cacheDir}/${filename}`,
              MAX_IMAGE_CARD_MODULE_PREVIEW_SIZE,
            );
      refKey = key;

      const buffer = await promise;

      NativeTextureLoader.ref(refKey);

      setTextureInfo(buffer);

      if (canceled) {
        return;
      }
    })();

    return () => {
      if (refKey) {
        NativeTextureLoader.unref(refKey);
      }
      abortController.abort();
    };
  }, [media]);

  const skImage = useDerivedValue(() => {
    if (!textureInfo) {
      return null;
    }
    return createImageFromNativeTexture(textureInfo);
  }, [textureInfo]);

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

  if (!media || !skImage || !textureInfo) {
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
