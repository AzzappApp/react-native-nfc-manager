import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { View, useWindowDimensions, Pressable } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Text from '#ui/Text';
import Skeleton from './Skeleton';
import SwitchToggle from './SwitchToggle';
import WebCardRenderer, { DESKTOP_PREVIEW_WIDTH } from './WebCardRenderer';
import type { ModuleRenderInfo } from './cardModules/CardModuleRenderer';
import type { CoverRenderer_profile$key } from '@azzapp/relay/artifacts/CoverRenderer_profile.graphql';
import type { WebCardBackground_profile$key } from '@azzapp/relay/artifacts/WebCardBackground_profile.graphql';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { ViewProps } from 'react-native';

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
  const intl = useIntl();
  const styles = useStyleSheet(stylesheet);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('mobile');

  const { width: windowWidth } = useWindowDimensions();

  const webCardsItemWidth =
    viewMode === 'mobile' ? windowWidth / 2 : windowWidth - 100;
  const webCardsItemHeight =
    height - SWITCH_TOGGLE_HEIGHT_SECTION_HEIGHT - LABEL_CONTAINER_HEIGHT;

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexSharedValue = useSharedValue(currentIndex);

  useEffect(() => {
    onSelectedIndexChange?.(currentIndex);
  }, [currentIndex, onSelectedIndexChange]);

  const scrollToIndex = useCallback(
    (index: number) => {
      currentIndexSharedValue.value = withTiming(
        index,
        { duration: 100 },
        () => {
          runOnJS(setCurrentIndex)(index);
        },
      );
    },
    [currentIndexSharedValue],
  );

  const onEndReachedRef = useRef(onEndReached);
  useEffect(() => {
    onEndReachedRef.current = onEndReached;
  }, [onEndReached]);

  useEffect(() => {
    if (currentIndex >= cards.length - 4) {
      return;
    }
    onEndReachedRef.current?.();
  }, [currentIndex, cards.length]);

  const nbCards = cards.length;

  const startOffset = useSharedValue(0);
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-20, 20])
        .onBegin(() => {
          startOffset.value = currentIndexSharedValue.value;
        })
        .onUpdate(event => {
          currentIndexSharedValue.value =
            startOffset.value - event.translationX / windowWidth;
        })
        .onEnd(({ velocityX }) => {
          const prevIndex = Math.floor(currentIndexSharedValue.value);
          const nextIndex = Math.ceil(currentIndexSharedValue.value);
          currentIndexSharedValue.value = withDecay(
            {
              velocity: -velocityX,
              clamp: [Math.max(prevIndex, 0), Math.min(nextIndex, nbCards - 1)],
              velocityFactor: 1 / windowWidth,
              deceleration: 0.8,
            },
            () => {
              const endIndex = Math.round(currentIndexSharedValue.value);
              currentIndexSharedValue.value = withSpring(endIndex);
              runOnJS(setCurrentIndex)(endIndex);
            },
          );
        }),
    [nbCards, currentIndexSharedValue, startOffset, windowWidth],
  );

  const webCardListAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX:
            -currentIndexSharedValue.value * (webCardsItemWidth + GAP),
        },
      ],
    };
  }, [webCardsItemWidth]);

  const renderedItems = cards
    .map((card, index) => ({ card, index }))
    .slice(
      Math.max(currentIndex - 2, 0),
      Math.min(currentIndex + 4, cards.length),
    );

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
      <View key={viewMode} style={{ flex: 1 }}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.webCardList, webCardListAnimatedStyle]}>
            {renderedItems.map(({ card, index }) => (
              <WebCardListItemMemo
                key={card.id}
                card={card}
                index={index}
                skeltonOnly={Math.abs(currentIndex - index) > 2}
                isSelected={currentIndex === index}
                initialWebCardScrollPosition={initialWebCardScrollPosition}
                viewMode={viewMode}
                webCardsItemWidth={webCardsItemWidth}
                webCardsItemHeight={webCardsItemHeight}
                scrollToIndex={scrollToIndex}
              />
            ))}
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
};

export default WebCardList;

type WebCardListItemProps = {
  card: WebCardInfo;
  index: number;
  isSelected: boolean;
  skeltonOnly?: boolean;
  initialWebCardScrollPosition: 'halfCover' | 'start';
  viewMode: 'desktop' | 'mobile';
  webCardsItemWidth: number;
  webCardsItemHeight: number;
  scrollToIndex: (index: number) => void;
};

const WebCardListItem = ({
  card,
  index,
  isSelected,
  skeltonOnly,
  initialWebCardScrollPosition,
  viewMode,
  webCardsItemWidth,
  webCardsItemHeight,
  scrollToIndex,
}: WebCardListItemProps) => {
  const { width: windowWidth } = useWindowDimensions();
  const styles = useStyleSheet(stylesheet);
  const webCardsInnerdWidth =
    viewMode === 'mobile' ? windowWidth : DESKTOP_PREVIEW_WIDTH;
  const scale = webCardsItemWidth / webCardsInnerdWidth;
  const webCardInnerHeight = webCardsItemHeight / scale;
  const initialOffset = viewMode === 'mobile' ? windowWidth / 4 : 50;
  const position = initialOffset + index * (webCardsItemWidth + GAP);

  const onPress = () => {
    scrollToIndex(index);
  };

  const [showSkelton, setShowSkelton] = useState(true);

  useEffect(() => {
    if (skeltonOnly) {
      setShowSkelton(true);
    } else {
      setTimeout(() => {
        setShowSkelton(false);
      }, 300);
    }
  }, [skeltonOnly]);

  return (
    <Pressable
      onPress={onPress}
      disabled={isSelected}
      style={{
        position: 'absolute',
        top: GAP,
        left: position,
        width: webCardsItemWidth,
        height: webCardsItemHeight,
      }}
    >
      <View style={styles.webCardContainer}>
        {!skeltonOnly && (
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
                profile={card.profile}
                cardStyle={card.cardStyle}
                cardColors={card.cardColors}
                cardModules={card.cardModules}
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
                scrollEnabled={isSelected}
                showsVerticalScrollIndicator={false}
                moduleActionEnabled={false}
              />
            </View>
          </View>
        )}
        {showSkelton && (
          <Skeleton
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: ITEM_RADIUS,
            }}
          />
        )}
      </View>
      <View style={styles.labelContainerHeight}>
        <Text variant="smallbold">{card.label}</Text>
      </View>
    </Pressable>
  );
};

const WebCardListItemMemo = memo(WebCardListItem);

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
}));
