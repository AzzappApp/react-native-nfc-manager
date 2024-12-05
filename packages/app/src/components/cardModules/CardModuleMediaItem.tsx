import { MODULE_IMAGE_MAX_WIDTH } from '@azzapp/shared/cardModuleHelpers';
import { MediaImageRenderer, MediaVideoRenderer } from '#components/medias';
import { getCardModuleMediaKind } from '#helpers/cardModuleHelpers';
import CardModuleMediaEditPreview from './CardModuleMediaEditPreview';
import type { CardModuleSourceMedia } from './cardModuleEditorType';
import type { ViewStyle } from 'react-native';

type CardModuleMediaItemProps = {
  media: CardModuleSourceMedia;
  /**
   *
   * display media dimension
   */
  dimension: { width: number; height: number };

  /**
   *Style to apply to the media, that can come from the card style
   */
  imageStyle?: ViewStyle;
};

//Simple component to render, not bind to any relay fragment
const CardModuleMediaItem = ({
  media,
  dimension,
  imageStyle,
}: CardModuleMediaItemProps) => {
  const isEditableVideoMedia =
    media.kind === 'video' &&
    media.duration !== media.timeRange?.duration &&
    media.timeRange?.startTime !== 0;

  if (
    media.editionParameters == null &&
    media.filter == null &&
    (media.kind === 'image' || !isEditableVideoMedia)
  ) {
    const kind = getCardModuleMediaKind(media);
    return kind === 'image' ? (
      <MediaImageRenderer
        source={{
          uri: media.uri,
          mediaId: media.id,
          requestedSize: MODULE_IMAGE_MAX_WIDTH,
        }}
        style={{
          ...dimension,
          ...imageStyle,
        }}
        fit="cover"
      />
    ) : (
      <MediaVideoRenderer
        source={{
          uri: media.uri,
          mediaId: media.id,
          requestedSize: dimension.width,
        }}
        style={{
          ...dimension,
          ...imageStyle,
        }}
        thumbnailURI={media.thumbnail}
        videoEnabled={true}
        paused={false}
      />
    );
  }

  return (
    <CardModuleMediaEditPreview
      media={media}
      itemWidth={dimension.width}
      itemHeight={dimension.height}
    />
  );
};

export default CardModuleMediaItem;
