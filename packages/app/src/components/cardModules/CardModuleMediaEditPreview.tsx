import { memo, useEffect, useState } from 'react';
import { useDerivedValue } from 'react-native-reanimated';
import TransformedImageRenderer from '#components/TransformedImageRenderer';
import TransformedVideoRenderer from '#components/TransformedVideoRenderer';
import {
  createImageFromNativeTexture,
  useNativeTexture,
} from '#helpers/mediaEditions';
import { CARD_MEDIA_VIDEO_DEFAULT_DURATION } from './cardModuleEditorType';
import type { CropData } from '#helpers/mediaEditions';
import type {
  CardModuleSourceMedia,
  CardModuleVideo,
} from './cardModuleEditorType';

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
  if (!media) {
    return null;
  }

  return media.kind === 'video' ? (
    <VideoRender media={media} itemWidth={itemWidth} itemHeight={itemHeight} />
  ) : (
    <ImageRender media={media} itemWidth={itemWidth} itemHeight={itemHeight} />
  );
};

const VideoRender = ({
  media,
  itemWidth,
  itemHeight,
}: {
  media: CardModuleVideo;
  itemWidth: number;
  itemHeight: number;
}) => {
  // ATTENTION: Video does not handle resize in real time(changing height and width).
  // something that is happning with desktop/mobile preview mode switching
  // We will need to re-render the component to apply the new size.
  // if you have a better way, please let me know
  const { cropData, ...editionParameters } = media.editionParameters ?? {};
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    // Force re-render when itemWidth or itemHeight changes. hate doing this
    setRenderKey(prevKey => prevKey + 1);
  }, [itemWidth, itemHeight]);

  return (
    <TransformedVideoRenderer
      key={renderKey}
      testID="card-module-media-edit-preview-video"
      video={media}
      width={itemWidth}
      height={itemHeight}
      filter={media.filter}
      editionParameters={{
        ...editionParameters,
        cropData: cropData
          ? calculateCropData(cropData, itemWidth, itemHeight)
          : null,
      }}
      startTime={media.timeRange?.startTime ?? 0}
      duration={media.timeRange?.duration ?? CARD_MEDIA_VIDEO_DEFAULT_DURATION}
      maxResolution={itemWidth * 2}
    />
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

  const textureInfo = useNativeTexture({
    uri: media?.uri,
    kind: media?.kind,
  });

  const skImage = useDerivedValue(() => {
    if (!textureInfo) {
      return null;
    }
    return createImageFromNativeTexture(textureInfo);
  }, [textureInfo]);

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
          ? calculateCropData(cropData, itemWidth, itemHeight)
          : null,
      }}
    />
  );
};

const calculateCropData = (
  cropData: CropData,
  itemWidth: number,
  itemHeight: number,
) => {
  const imageAspectRatio = cropData.width / cropData.height;
  const itemAspectRatio = itemWidth / itemHeight;

  let cropWidth;
  let cropHeight;
  let originX;
  let originY;

  if (imageAspectRatio > itemAspectRatio) {
    // Image is wider than the container
    cropHeight = cropData.height;
    cropWidth = cropHeight * itemAspectRatio;
    originX = (cropData.width - cropWidth) / 2;
    originY = 0;
  } else {
    // Image is taller than the container
    cropWidth = cropData.width;
    cropHeight = cropWidth / itemAspectRatio;
    originX = 0;
    originY = (cropData.height - cropHeight) / 2;
  }

  return {
    width: cropWidth,
    height: cropHeight,
    originX,
    originY,
  };
};
export default memo(CardModuleMediaEditPreview);
