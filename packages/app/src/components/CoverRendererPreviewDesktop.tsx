import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, View } from 'react-native';
import { useFragment } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import { getModuleDataValues } from '@azzapp/shared/cardModuleHelpers';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { isCustomModule } from '#helpers/webcardModuleHelpers';
import CoverRendererFragment from '#relayArtifacts/CoverRenderer_webCard.graphql';
import CoverRenderer from './CoverRenderer';
import type { ModuleRenderInfo } from '#components/cardModules/CardModuleRenderer';
import type { CoverRenderer_webCard$key } from '#relayArtifacts/CoverRenderer_webCard.graphql';
import type { ViewProps } from 'react-native';

export type CoverRendererPreviewDesktopProps = ViewProps & {
  /**
   * The relay reference to the cover
   */
  webCard: CoverRenderer_webCard$key;

  videoEnabled?: boolean;

  firstModule?: ModuleRenderInfo;
};

const COVER_DESKTOP_WIDTH = 300;

/**
 * Renders a card cover in desktop preview mode
 */
const CoverRendererPreviewDesktop = ({
  webCard: coverKey,
  videoEnabled,
  style,
  firstModule,
  ...props
}: CoverRendererPreviewDesktopProps) => {
  const { coverMedia, cardColors } =
    useFragment(CoverRendererFragment, coverKey) ?? {};

  const { __typename, uri, thumbnail } = coverMedia ?? {};

  const mediaUri = __typename === 'MediaVideo' ? thumbnail : uri;
  let backgroundColor: string | undefined = undefined;
  if (firstModule) {
    if (isCustomModule(firstModule.kind)) {
      const moduleData = firstModule?.data
        ? getModuleDataValues({ data: firstModule.data })
        : null;
      const backgroundStyle =
        moduleData && 'backgroundStyle' in moduleData
          ? moduleData?.backgroundStyle
          : null;
      const colorTop =
        moduleData && 'colorTop' in moduleData ? moduleData?.colorTop : null;

      backgroundColor =
        (backgroundStyle?.backgroundColor || colorTop) ?? backgroundColor;
    } else if ('cardModuleColor' in firstModule.data) {
      backgroundColor = firstModule.data.cardModuleColor.background;
    }
  }

  return (
    <View {...props} style={[style, styles.wrapper]}>
      {/* {background && (
        <MediaImageRenderer
          testID="CoverRenderer_background"
          source={{
            uri: background.smallURI,
            mediaId: background.id,
            requestedSize: COVER_BASE_WIDTH,
          }}
          tintColor={swapColor(backgroundPatternColor, cardColors)}
          style={styles.layer}
        />
      )} */}
      <Image
        style={StyleSheet.absoluteFill}
        source={{ uri: mediaUri }}
        contentFit="cover"
        contentPosition="center"
        blurRadius={Platform.select({
          ios: 15,
          android: 10,
        })}
      />
      <LinearGradient
        colors={[
          'transparent',
          backgroundColor
            ? (swapColor(backgroundColor, cardColors) ?? '#FFF')
            : '#FFF',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 0.95]}
        style={styles.layer}
      />
      <CoverRenderer
        style={styles.cover}
        webCard={coverKey}
        width={COVER_DESKTOP_WIDTH}
        large
        canPlay={videoEnabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    paddingVertical: 50,
  },
  layer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    aspectRatio: COVER_RATIO,
  },
  cover: { alignSelf: 'center', borderRadius: 35 },
});

export default CoverRendererPreviewDesktop;
