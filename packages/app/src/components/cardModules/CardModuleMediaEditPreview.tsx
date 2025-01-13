import { Image } from 'expo-image';
import { memo } from 'react';
import { useDerivedValue } from 'react-native-reanimated';
import TransformedImageRenderer from '#components/TransformedImageRenderer';
import TransformedVideoRenderer from '#components/TransformedVideoRenderer';
import {
  createImageFromNativeTexture,
  useNativeTexture,
} from '#helpers/mediaEditions';
import { CARD_MEDIA_VIDEO_DEFAULT_DURATION } from './cardModuleEditorType';
import CardModuleMediaItem from './CardModuleMediaItem';
import type {
  CardModuleImage,
  CardModuleSourceMedia,
  CardModuleVideo,
} from './cardModuleEditorType';
import type { StyleProp, ViewStyle } from 'react-native';

type CardModuleMediaEditPreviewProps = {
  media: CardModuleSourceMedia;
  dimension: { width: number; height: number };
  imageStyle?: ViewStyle;
};

const CardModuleMediaEditPreview = ({
  media,
  dimension,
  imageStyle,
}: CardModuleMediaEditPreviewProps) => {
  if (!media) {
    return null;
  }

  if (!media.uri.startsWith('file://')) {
    return (
      <CardModuleMediaItem
        media={media}
        dimension={dimension}
        canPlay
        imageStyle={imageStyle}
      />
    );
  }

  const { width: itemWidth, height: itemHeight } = dimension;
  return media.kind === 'video' ? (
    <VideoRender
      media={media}
      itemWidth={itemWidth}
      itemHeight={itemHeight}
      style={imageStyle}
    />
  ) : (
    <ImageRender
      media={media}
      itemWidth={itemWidth}
      itemHeight={itemHeight}
      imageStyle={imageStyle}
    />
  );
};

type VideoRenderProps = {
  media: CardModuleVideo;
  itemWidth: number;
  itemHeight: number;
  style?: StyleProp<ViewStyle>;
};

const VideoRender = ({
  media,
  itemWidth,
  itemHeight,
  style,
}: VideoRenderProps) => {
  const maxResolution = itemWidth * 2;
  const cropData = calculateCropData(media, itemWidth, itemHeight);
  return (
    <TransformedVideoRenderer
      key={`${itemWidth}-${itemHeight}`}
      testID="card-module-media-edit-preview-video"
      video={media}
      width={itemWidth}
      height={itemHeight}
      filter={media.filter}
      style={style}
      editionParameters={{
        ...media.editionParameters,
        cropData,
      }}
      startTime={media.timeRange?.startTime ?? 0}
      duration={media.timeRange?.duration ?? CARD_MEDIA_VIDEO_DEFAULT_DURATION}
      maxResolution={maxResolution}
    />
  );
};

type ImageRenderProps = {
  media: CardModuleImage;
  itemWidth: number;
  itemHeight: number;
  imageStyle?: StyleProp<ViewStyle>;
};

const ImageRender = ({
  media,
  itemWidth,
  itemHeight,
  imageStyle,
}: ImageRenderProps) => {
  const { cropData, ...editionParameters } = media.editionParameters ?? {};

  return media.filter ||
    Object.entries(editionParameters).filter(([, value]) => value).length >
      0 ? (
    <ImageSkiaRender
      media={media}
      itemWidth={itemWidth}
      itemHeight={itemHeight}
      imageStyle={imageStyle}
    />
  ) : (
    <Image
      source={media}
      style={{ width: itemWidth, height: itemHeight }}
      contentFit="cover"
    />
  );
};

const ImageSkiaRender = ({
  media,
  itemWidth,
  itemHeight,
  imageStyle,
}: ImageRenderProps) => {
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
      imageStyle={imageStyle}
      editionParameters={{
        ...media.editionParameters,
        cropData: calculateCropData(media, itemWidth, itemHeight),
      }}
    />
  );
};

const calculateCropData = (
  media: CardModuleSourceMedia,
  itemWidth: number,
  itemHeight: number,
) => {
  const cropData = media.editionParameters?.cropData ?? {
    originX: 0,
    originY: 0,
    width: media.width,
    height: media.height,
  };
  const imageAspectRatio = cropData.width / cropData.height;
  const itemAspectRatio = itemWidth / itemHeight;

  let cropWidth;
  let cropHeight;
  let originX;
  let originY;

  if (imageAspectRatio > itemAspectRatio) {
    cropHeight = cropData.height;
    cropWidth = cropHeight * itemAspectRatio;
    originX = (cropData.width - cropWidth) / 2;
    originY = 0;
  } else {
    cropWidth = cropData.width;
    cropHeight = cropWidth / itemAspectRatio;
    originX = 0;
    originY = (cropData.height - cropHeight) / 2;
  }

  return {
    originX,
    originY,
    width: cropWidth,
    height: cropHeight,
  };
};
export default memo(CardModuleMediaEditPreview);
