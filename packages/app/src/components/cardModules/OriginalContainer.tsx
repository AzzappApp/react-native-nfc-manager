import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { getCardModuleMediaKind } from '#helpers/cardModuleHelpers';
import { getImageSize, getVideoSize } from '#helpers/mediaHelpers';
import useIsModuleItemInViewPort from '#hooks/useIsModuleItemInViewPort';
import CardModuleMediaSelector from './CardModuleMediaSelector';
import type {
  CardModuleDimension,
  CardModuleSourceMedia,
} from './cardModuleEditorType';
import type { CardStyle } from '@azzapp/shared/cardHelpers';
import type { ViewStyle, Animated as RNAnimated } from 'react-native';

const DESKTOP_CONTENT_MAX_WIDTH = 800;

type OriginalContainerProps = {
  media: CardModuleSourceMedia;
  index: number;
  scrollY: RNAnimated.Value;
  canPlay: boolean;
  modulePosition?: number;
  imageStyle?: ViewStyle; // some variant need opacity and background color (mediaText) but not other (media)
  cardStyle?: CardStyle | null;
  dimension: CardModuleDimension;
};

const OriginalContainer = ({
  media,
  canPlay,
  index,
  scrollY,
  modulePosition,
  imageStyle,
  cardStyle,
  dimension: viewDimension,
}: OriginalContainerProps) => {
  const [mediaDimension, setMediaDimension] = useState({
    width: media.width,
    height: media.height,
  });

  useEffect(() => {
    if (!mediaDimension.width || !mediaDimension.height) {
      const isImage = getCardModuleMediaKind(media) === 'image';
      const refreshDimension = async () => {
        const newDimension = isImage
          ? await getImageSize(media.uri)
          : await getVideoSize(media.uri);
        setMediaDimension(newDimension);
      };
      refreshDimension();
    }
  }, [media, media.uri, mediaDimension.height, mediaDimension.width]);

  const itemStartY = (modulePosition ?? 0) + index * mediaDimension.height;
  const inViewport = useIsModuleItemInViewPort(
    scrollY,
    itemStartY,
    mediaDimension,
  );

  const mediaAspectRatio = mediaDimension.height / mediaDimension.width;
  let displayedWidth = viewDimension.width;
  if (displayedWidth > DESKTOP_CONTENT_MAX_WIDTH) {
    displayedWidth = DESKTOP_CONTENT_MAX_WIDTH;
  } else {
    displayedWidth = displayedWidth - (cardStyle?.gap || 0) * 2;
  }

  return (
    <View style={styles.container}>
      <CardModuleMediaSelector
        media={media}
        dimension={{
          width: viewDimension.width,
          height: viewDimension.width * mediaAspectRatio,
        }}
        canPlay={canPlay && inViewport}
        imageStyle={{
          width: displayedWidth,
          height: displayedWidth * mediaAspectRatio,
          flex: 1,
          borderRadius: cardStyle?.borderRadius || 0,
          ...imageStyle,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
  },
});

export default OriginalContainer;
