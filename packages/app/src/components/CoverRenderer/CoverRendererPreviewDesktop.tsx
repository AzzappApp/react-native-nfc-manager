import { Image } from 'expo-image';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFragment } from 'react-relay';
import CoverRendererFragment from '@azzapp/relay/artifacts/CoverRenderer_profile.graphql';
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
  ...props
}: CoverRendererPreviewDesktopProps) => {
  const { cardCover } = useFragment(CoverRendererFragment, coverKey) ?? {};

  const { media } = cardCover ?? {};

  const { __typename, uri, thumbnail } = media ?? {};

  const mediaUri = __typename === 'MediaVideo' ? thumbnail : uri;

  const { width: windowWidth } = useWindowDimensions();

  return (
    <View {...props}>
      <Image
        style={StyleSheet.absoluteFill}
        source={{ uri: mediaUri }}
        contentFit="cover"
        contentPosition="bottom"
        blurRadius={Platform.select({
          ios: 5,
          android: 2,
        })}
      />
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

export default CoverRendererPreviewDesktop;
