import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { View, useWindowDimensions, Pressable, FlatList } from 'react-native';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Text from '#ui/Text';
import SwitchToggle from './SwitchToggle';
import WebCardRenderer, { DESKTOP_PREVIEW_WIDTH } from './WebCardRenderer';
import type { ModuleRenderInfo } from './cardModules/CardModuleRenderer';
import type { CoverRenderer_profile$key } from '@azzapp/relay/artifacts/CoverRenderer_profile.graphql';
import type { WebCardBackground_profile$key } from '@azzapp/relay/artifacts/WebCardBackground_profile.graphql';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type {
  ViewProps,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ListRenderItem,
} from 'react-native';

export type WebCardInfo = {
  /**
   * the id of the web card preview.
   */
  id: string;
  /**
   * The label of the web card preview.
   */
  label: string;
  /**
   * The profile to render.
   */
  profile: CoverRenderer_profile$key & WebCardBackground_profile$key;
  /**
   * The card style to use to render the web card.
   */
  cardStyle: CardStyle;
  /**
   * The card colors to use to render the web card.
   */
  cardColors?: ColorPalette | null;
  /**
   * The modules list to render.
   */
  cardModules: ModuleRenderInfo[];
};

type WebCardListProps = Omit<ViewProps, 'children'> & {
  /**
   * the list of web card preview to render.
   */
  cards: WebCardInfo[];
  /**
   * Should the preview be scrolled past the half of the cover
   */
  initialWebCardScrollPosition?: 'halfCover' | 'start';
  /**
   * The height of the component.
   */
  height: number;
  /**
   * Called when the selected index change.
   * @param index The selected index.
   */
  onSelectedIndexChange?: (index: number) => void;
  /**
   * A callback that is called when the end of the list is reached, used for pagination.
   */
  onEndReached?: () => void;
};

/**
 * A component that renders a list of web card preview.
 * And allows the use to select one.
 */
const WebCardList = ({
  cards,
  initialWebCardScrollPosition = 'start',
  height,
  onSelectedIndexChange,
  onEndReached,
  ...props
}: WebCardListProps) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('mobile');

  const styles = useStyleSheet(stylesheet);
  const { width: windowWidth } = useWindowDimensions();

  const webCardsItemWidth =
    viewMode === 'mobile' ? windowWidth / 2 : windowWidth - 100;
  const webCardsItemHeight =
    height - SWITCH_TOGGLE_HEIGHT_SECTION_HEIGHT - LABEL_CONTAINER_HEIGHT;
  const webCardsInnerdWidth =
    viewMode === 'mobile' ? windowWidth : DESKTOP_PREVIEW_WIDTH;
  const scale = webCardsItemWidth / webCardsInnerdWidth;
  const webCardInnerHeight = webCardsItemHeight / scale;

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(currentIndex);
  const onScroll = useCallback(
    ({
      nativeEvent: { contentOffset },
    }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(contentOffset.x / (webCardsItemWidth + GAP));
      if (index === currentIndexRef.current) {
        return;
      }
      currentIndexRef.current = index;
      setCurrentIndex(index);
      onSelectedIndexChange?.(index);
    },
    [webCardsItemWidth, onSelectedIndexChange],
  );

  const getItemLayout = useCallback(
    (_data: unknown, index: number) => ({
      length: webCardsItemWidth,
      offset: (webCardsItemWidth + GAP) * index,
      index,
    }),
    [webCardsItemWidth],
  );

  const flatListRef = useRef<FlatList>(null);
  const scrollToIndex = useCallback((index: number) => {
    flatListRef?.current?.scrollToIndex({
      index,
    });
  }, []);

  useEffect(() => {
    if (cards.length > 0) {
      flatListRef?.current?.scrollToIndex({
        index: currentIndexRef.current,
        animated: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, cards]);

  const renderItem = useCallback<ListRenderItem<WebCardInfo>>(
    ({ item, index }) => (
      <Pressable
        onPress={() => scrollToIndex(index)}
        disabled={currentIndex === index}
        style={{ width: webCardsItemWidth }}
      >
        <View style={styles.webCardContainer}>
          <View style={styles.webCardContainerRadius}>
            <View
              style={{
                width: webCardsInnerdWidth,
                height: webCardInnerHeight,
                backgroundColor: '#FFFFFF',
                transform: [
                  { translateX: (webCardsItemWidth - webCardsInnerdWidth) / 2 },
                  { translateY: (webCardsItemHeight - webCardInnerHeight) / 2 },
                  { scale },
                ],
              }}
            >
              <WebCardRenderer
                contentOffset={{
                  x: 0,
                  y:
                    initialWebCardScrollPosition === 'halfCover'
                      ? webCardsItemWidth / (2 * COVER_RATIO) / scale
                      : 0,
                }}
                profile={item.profile}
                cardStyle={item.cardStyle}
                cardColors={item.cardColors}
                cardModules={item.cardModules}
                viewMode={viewMode}
                style={{
                  flexShrink: 0,
                  width: webCardsInnerdWidth,
                  height: webCardInnerHeight,
                }}
                contentContainerStyle={{
                  flexShrink: 0,
                  flexGrow: 1,
                  minHeight:
                    webCardInnerHeight +
                    webCardsItemWidth / COVER_RATIO / scale,
                }}
                nestedScrollEnabled
                overScrollMode="always"
                scrollEnabled={currentIndex === index}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </View>
        <View style={styles.labelContainerHeight}>
          <Text variant="smallbold">{item.label}</Text>
        </View>
      </Pressable>
    ),
    [
      currentIndex,
      webCardsItemWidth,
      styles.webCardContainer,
      styles.webCardContainerRadius,
      styles.labelContainerHeight,
      webCardsInnerdWidth,
      webCardInnerHeight,
      webCardsItemHeight,
      scale,
      initialWebCardScrollPosition,
      viewMode,
      scrollToIndex,
    ],
  );

  const intl = useIntl();

  return (
    <View {...props}>
      <View style={styles.switchToggleContainer}>
        <SwitchToggle
          value={viewMode}
          onChange={setViewMode}
          values={[
            {
              value: 'mobile',
              label: intl.formatMessage({
                defaultMessage: 'Mobile',
                description: 'Mobile view mode title in web card preview',
              }),
            },
            {
              value: 'desktop',
              label: intl.formatMessage({
                defaultMessage: 'Desktop',
                description: 'Desktop view mode title in web card preview',
              }),
            },
          ]}
        />
      </View>
      <FlatList
        ref={flatListRef}
        data={cards}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={onEndReached}
        getItemLayout={getItemLayout}
        snapToInterval={webCardsItemWidth + GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.webCardList}
        contentContainerStyle={[
          styles.webCardListContentContainer,
          {
            paddingHorizontal: viewMode === 'mobile' ? windowWidth / 4 : 50,
            gap: GAP,
          },
        ]}
        nestedScrollEnabled
      />
    </View>
  );
};

export default WebCardList;

const keyExtractor = (item: WebCardInfo) => item.id;

const GAP = 20;
const ITEM_RADIUS = 20;
const SWITCH_TOGGLE_HEIGHT_SECTION_HEIGHT = 52;
const LABEL_CONTAINER_HEIGHT = 55;

const stylesheet = createStyleSheet(theme => ({
  switchToggleContainer: {
    paddingHorizontal: 20,
    height: SWITCH_TOGGLE_HEIGHT_SECTION_HEIGHT,
    justifyContent: 'center',
  },
  labelContainerHeight: {
    height: LABEL_CONTAINER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webCardContainer: [
    {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: ITEM_RADIUS,
    },
    shadow(theme, 'bottom'),
  ],
  webCardContainerRadius: {
    borderRadius: ITEM_RADIUS,
    overflow: 'hidden',
    flex: 1,
  },
  webCardList: {
    flex: 1,
  },
  webCardListContentContainer: {
    paddingVertical: GAP,
  },
}));
