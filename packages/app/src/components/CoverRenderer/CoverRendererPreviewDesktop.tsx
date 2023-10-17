import { Image } from 'expo-image';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFragment } from 'react-relay';
import CoverRendererFragment from '@azzapp/relay/artifacts/CoverRenderer_profile.graphql';
import { swapColor } from '@azzapp/shared/cardHelpers';
import { COVER_BASE_WIDTH, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { MediaImageRenderer } from '#components/medias';
import CoverRenderer from './CoverRenderer';
import type { CoverRenderer_profile$key } from '@azzapp/relay/artifacts/CoverRenderer_profile.graphql';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

export type CoverRendererPreviewDesktopProps = ViewProps & {
  /**
   * The relay reference to the cover
   */
  profile: CoverRenderer_profile$key;

  videoEnabled?: boolean;
};

/**
 * Renders a card cover in desktop preview mode
 */
const CoverRendererPreviewDesktop = ({
  profile: coverKey,
  videoEnabled,
  style,
  ...props
}: CoverRendererPreviewDesktopProps) => {
  const { cardCover, cardColors } =
    useFragment(CoverRendererFragment, coverKey) ?? {};

  const {
    media,
    foreground,
    foregroundColor,
    background,
    backgroundPatternColor,
  } = cardCover ?? {};

  const { __typename, uri, thumbnail } = media ?? {};

  const mediaUri = __typename === 'MediaVideo' ? thumbnail : uri;

  const { width: windowWidth } = useWindowDimensions();

  return (
    <View {...props} style={[style, styles.wrapper]}>
      {background && (
        <MediaImageRenderer
          testID="CoverRenderer_background"
          source={{
            uri: background.smallURI,
            mediaId: background.id,
            requestedSize: COVER_BASE_WIDTH,
          }}
          tintColor={swapColor(backgroundPatternColor, cardColors)}
          aspectRatio={COVER_RATIO}
          style={styles.layer}
        />
      )}
      <Image
        style={StyleSheet.absoluteFill}
        source={{ uri: mediaUri }}
        contentFit="cover"
        contentPosition="bottom"
        blurRadius={Platform.select({
          ios: 15,
          android: 10,
        })}
      />
      {foreground && (
        <MediaImageRenderer
          testID="CoverRenderer_foreground"
          source={{
            uri: foreground.smallURI,
            mediaId: foreground.id,
            requestedSize: COVER_BASE_WIDTH,
          }}
          tintColor={swapColor(foregroundColor, cardColors)}
          aspectRatio={COVER_RATIO}
          style={styles.layer}
        />
      )}
      <CoverRenderer
        style={{ alignSelf: 'center' }}
        profile={coverKey}
        width={windowWidth}
        hideBorderRadius
        videoEnabled={videoEnabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    aspectRatio: COVER_RATIO,
  },
});

export default CoverRendererPreviewDesktop;
