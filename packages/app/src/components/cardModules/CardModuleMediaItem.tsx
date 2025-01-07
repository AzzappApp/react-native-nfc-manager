import { MODULE_IMAGE_MAX_WIDTH } from '@azzapp/shared/cardModuleHelpers';
import { MediaImageRenderer, MediaVideoRenderer } from '#components/medias';
import { getCardModuleMediaKind } from '#helpers/cardModuleHelpers';
import type { CardModuleSourceMedia } from './cardModuleEditorType';
import type { ViewStyle } from 'react-native';

export type CardModuleMediaItemProps = {
  media: CardModuleSourceMedia;

  /**
   * Wether the media can be played or not
   */
  canPlay: boolean;
  /**
   *
   * display media dimension
   */
  dimension: { width: number; height: number };

  /**
   *Style to apply to the media, that can come from the card style
   */
  imageStyle?: ViewStyle;

  paused?: boolean;
};

//Simple component to render, not bind to any relay fragment
const CardModuleMediaItem = ({
  media,
  dimension,
  imageStyle,
  canPlay,
}: CardModuleMediaItemProps) => {
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
      videoEnabled={canPlay}
      paused={false}
      muted
    />
  );
};

export default CardModuleMediaItem;
