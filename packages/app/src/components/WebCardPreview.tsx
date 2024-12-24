import { useCallback, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { ScrollView, View, useWindowDimensions, Animated } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import {
  swapColor,
  type CardStyle,
  type ColorPalette,
} from '@azzapp/shared/cardHelpers';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import ToggleButton from '#ui/ToggleButton';
import CardModuleRenderer from './cardModules/CardModuleRenderer';
import CoverRenderer from './CoverRenderer';
import CoverRendererPreviewDesktop from './CoverRendererPreviewDesktop';
import WebCardBackground from './WebCardBackgroundPreview';
import type { WebCardPreview_webCard$key } from '#relayArtifacts/WebCardPreview_webCard.graphql';
import type { ModuleRenderInfo } from './cardModules/CardModuleRenderer';
import type { LayoutChangeEvent, PointProp, ViewProps } from 'react-native';

export type WebCardPreviewProps = Omit<ViewProps, 'children'> & {
  /**
   * The webCard to render.
   * Contains the cover informations.
   */
  webCard: WebCardPreview_webCard$key;
  /**
   * The card style to use.
   */
  cardStyle: CardStyle | null;
  /**
   * The card colors to use.
   */
  cardColors?: ColorPalette | null;
  /**
   * The modules list to render.
   */
  cardModules: ModuleRenderInfo[];
  /**
   * The height of the preview.
   */
  height: number;
  /**
   * @see ScrollViewProps#contentOffset
   */
  contentOffset?: PointProp | undefined; // zeros
  /**
   * scrollView contentContainer padding bottom
   * @default 0
   */
  contentPaddingBottom?: number;
};

/**
 * This component is used to preview a web card in mobile or desktop mode.
 */
const WebCardPreview = ({
  webCard: webCardKey,
  cardModules,
  cardColors,
  cardStyle,
  height,
  contentOffset,
  contentPaddingBottom = 0,
  style,
  ...props
}: WebCardPreviewProps) => {
  const styles = useStyleSheet(stylesheet);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('mobile');

  const { width: windowWidth } = useWindowDimensions();
  const scale = viewMode === 'mobile' ? 1 : windowWidth / DESKTOP_PREVIEW_WIDTH;
  const webCardWidth =
    viewMode === 'mobile' ? windowWidth : DESKTOP_PREVIEW_WIDTH;
  const webCardOuterHeight = height - SWITCH_TOGGLE_SECTION_HEIGHT;
  const webCardHeight = webCardOuterHeight / scale;

  const webCard = useFragment(
    graphql`
      fragment WebCardPreview_webCard on WebCard {
        coverBackgroundColor
        ...CoverRenderer_webCard
        ...WebCardBackground_webCard
        ...WebCardBackgroundPreview_webCard
        coverBackgroundColor
      }
    `,
    webCardKey,
  );

  const intl = useIntl();

  const contentRef = useRef<View>(null);

  const lastSection = cardModules[cardModules.length - 1]?.data as any;

  const lastSectionColor = lastSection?.data?.backgroundStyle
    ?.backgroundColor as string;

  const scrollPosition = useRef(new Animated.Value(0)).current;

  const onScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollPosition } } }],
        { useNativeDriver: true },
      ),
    [scrollPosition],
  );

  return (
    <View
      style={{
        width: windowWidth,
        height,
      }}
      {...props}
    >
      <View style={styles.toggleContainer}>
        <View style={{ flex: 1 }}>
          <ToggleButton
            variant="rounded_menu"
            label={intl.formatMessage({
              defaultMessage: 'Mobile',
              description: 'Mobile view mode title in web card preview',
            })}
            toggled={viewMode === 'mobile'}
            onPress={() => setViewMode('mobile')}
          />
        </View>
        <View style={{ flex: 1 }}>
          <ToggleButton
            variant="rounded_menu"
            label={intl.formatMessage({
              defaultMessage: 'Desktop',
              description: 'Desktop view mode title in web card preview',
            })}
            toggled={viewMode === 'desktop'}
            onPress={() => setViewMode('desktop')}
          />
        </View>
      </View>
      <View
        style={{
          overflow: 'hidden',
          width: webCardWidth,
          height: webCardHeight,
          transform: [
            { translateX: (windowWidth - webCardWidth) / 2 },
            { translateY: (webCardOuterHeight - webCardHeight) / 2 },
            { scale },
          ],
        }}
      >
        <ScrollView
          style={[
            styles.webCardContainer,
            style,
            { backgroundColor: swapColor(lastSectionColor, cardColors) },
          ]}
          contentOffset={contentOffset}
          contentContainerStyle={{
            paddingBottom: contentPaddingBottom / scale,
          }}
          onScroll={onScroll}
        >
          <View ref={contentRef}>
            <WebCardBackground
              webCard={webCard}
              overrideCardStyle={cardStyle}
              overrideLastModule={cardModules.at(-1)}
              style={styles.webCardBackground}
            />
            {viewMode === 'desktop' ? (
              <CoverRendererPreviewDesktop
                webCard={webCard}
                firstModule={cardModules.length ? cardModules[0] : undefined}
                videoEnabled
              />
            ) : (
              <CoverRenderer
                webCard={webCard}
                width={windowWidth}
                large
                canPlay
              />
            )}
            {cardModules.map((module, index) => (
              <CardModule
                module={module}
                key={index}
                cardColors={cardColors}
                cardStyle={cardStyle}
                viewMode={viewMode}
                coverBackgroundColor={webCard.coverBackgroundColor}
                scrollPosition={scrollPosition}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const CardModule = ({
  module,
  cardColors,
  cardStyle,
  viewMode,
  coverBackgroundColor,
  scrollPosition,
}: {
  module: ModuleRenderInfo;
  cardColors?: ColorPalette | null;
  cardStyle?: CardStyle | null;
  viewMode: 'desktop' | 'mobile';
  coverBackgroundColor?: string | null;
  scrollPosition: Animated.Value;
}) => {
  const [modulePosition, setModulePosition] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setModulePosition(event.nativeEvent.layout.y);
  }, []);

  return (
    <CardModuleRenderer
      module={module}
      onLayout={onLayout}
      colorPalette={cardColors}
      cardStyle={cardStyle}
      viewMode={viewMode}
      coverBackgroundColor={coverBackgroundColor}
      scrollPosition={scrollPosition}
      modulePosition={modulePosition}
    />
  );
};

const stylesheet = createStyleSheet(theme => ({
  toggleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  webCardContainer: {
    flex: 1,
    backgroundColor: theme === 'dark' ? colors.black : colors.white,
  },
  webCardBackground: {
    position: 'absolute',
    width: '100%',
    height: '150%',
    top: '-25%',
    left: 0,
    zIndex: -1,
  },
}));

export default WebCardPreview;

const SWITCH_TOGGLE_SECTION_HEIGHT = 52;

export const DESKTOP_PREVIEW_WIDTH = 900;
