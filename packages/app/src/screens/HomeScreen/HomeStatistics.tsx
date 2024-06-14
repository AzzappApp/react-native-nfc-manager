import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedScrollHandler,
  useSharedValue,
  interpolate,
  useAnimatedStyle,
  useAnimatedReaction,
  useAnimatedRef,
} from 'react-native-reanimated';
import { useFragment, graphql } from 'react-relay';
import { colors, fontFamilies } from '#theme';
import AnimatedText from '#components/AnimatedText';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import Text from '#ui/Text';
import { format } from './HomeInformations';
import { useHomeScreenInputProfileRange } from './HomeScreenContext';
import HomeStatisticsChart from './HomeStatisticsChart';
import type { HomeStatistics_profiles$key } from '#relayArtifacts/HomeStatistics_profiles.graphql';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

type HomeInformationsProps = {
  user: HomeStatistics_profiles$key;
  height: number;
  currentProfileIndexSharedValue: SharedValue<number>;
  variant?: 'dark' | 'light';
  mode?: 'compact' | 'full';
  initialStatsIndex?: number;
};

const HomeStatistics = ({
  user,
  height,
  currentProfileIndexSharedValue,
  variant = 'dark',
  initialStatsIndex = 0,
  mode = 'full',
}: HomeInformationsProps) => {
  const profiles = useFragment(
    graphql`
      fragment HomeStatistics_profiles on Profile @relay(plural: true) {
        id
        webCard {
          id
          nbLikes
          nbWebCardViews
        }
        nbContactCardScans
        ...HomeStatisticsChart_profiles
      }
    `,
    user,
  );

  const styles = useVariantStyleSheet(stylesheet, variant);

  const { width } = useWindowDimensions();
  const intl = useIntl();

  const scrollIndexOffset = useSharedValue(initialStatsIndex);
  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollIndexOffset.value = event.contentOffset.x / BOX_NUMBER_WIDTH;
  });
  const inputRange = useHomeScreenInputProfileRange();

  const likes = useMemo(
    () => profiles?.map(profile => profile.webCard.nbLikes) ?? [],
    [profiles],
  );
  const contactCardScans = useMemo(
    () => profiles?.map(profile => profile.nbContactCardScans ?? 0) ?? [],
    [profiles],
  );
  const webCardViews = useMemo(
    () => profiles?.map(profile => profile.webCard.nbWebCardViews) ?? [],
    [profiles],
  );

  const totalLikes = useSharedValue(
    format(likes[Math.round(currentProfileIndexSharedValue.value)] ?? '-1'),
  );
  const totalScans = useSharedValue(
    format(
      contactCardScans[Math.round(currentProfileIndexSharedValue.value)] ??
        '-1',
    ),
  );
  const totalViews = useSharedValue(
    format(
      webCardViews[Math.round(currentProfileIndexSharedValue.value)] ?? '-1',
    ),
  );

  useAnimatedReaction(
    () => currentProfileIndexSharedValue.value,
    actual => {
      if (profiles && profiles?.length > 1 && actual >= 0) {
        totalLikes.value = format(
          interpolate(currentProfileIndexSharedValue.value, inputRange, likes),
        );
        totalScans.value = format(
          interpolate(
            currentProfileIndexSharedValue.value,
            inputRange,
            contactCardScans,
          ),
        );
        totalViews.value = format(
          interpolate(
            currentProfileIndexSharedValue.value,
            inputRange,
            webCardViews,
          ),
        );
      } else if (actual >= 0) {
        totalLikes.value = format(likes[actual]);
        totalScans.value = format(contactCardScans[actual]);
        totalViews.value = format(webCardViews[actual]);
      }
    },

    [currentProfileIndexSharedValue.value, profiles, inputRange],
  );

  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();

  const onSelectStat = (index: number) => {
    scrollViewRef?.current?.scrollTo({ x: index * BOX_NUMBER_WIDTH, y: 0 });
  };

  //TODO: if performance issue, inquiry a more complex way to do the chart(skia, D3 etc). it is the simpler using only animated view.
  return (
    <View style={styles.container}>
      <HomeStatisticsChart
        width={width - 2 * PADDING_HORIZONTAL}
        height={height - BOX_NUMBER_HEIGHT}
        statsScrollIndex={scrollIndexOffset}
        currentProfileIndexSharedValue={currentProfileIndexSharedValue}
        user={profiles}
        variant={variant}
      />
      {mode === 'full' && (
        <AnimatedScrollView
          ref={scrollViewRef}
          style={{
            height: BOX_NUMBER_HEIGHT,
            width: '100%',
            overflow: 'visible',
            paddingTop: 5,
          }}
          pagingEnabled
          snapToInterval={BOX_NUMBER_WIDTH}
          decelerationRate="fast"
          snapToAlignment="start"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingLeft:
              (width - 2 * PADDING_HORIZONTAL - BOX_NUMBER_WIDTH) / 2,
            paddingRight:
              (width - 2 * PADDING_HORIZONTAL - BOX_NUMBER_WIDTH) / 2,
            overflow: 'visible',
            height: BOX_NUMBER_HEIGHT,
          }}
          bounces={false}
          scrollEventThrottle={16}
          horizontal
          onScroll={scrollHandler}
          contentOffset={{ x: initialStatsIndex * BOX_NUMBER_WIDTH, y: 0 }}
        >
          <StatisticItems
            variant={variant}
            value={totalViews}
            title={
              intl.formatMessage(
                {
                  defaultMessage: 'Webcard{azzappA} Views',
                  description: 'Home statistics - webcardView label',
                },
                {
                  azzappA: (
                    <Text style={styles.icon} variant="azzapp">
                      a
                    </Text>
                  ),
                },
              ) as string
            }
            scrollIndex={scrollIndexOffset}
            index={0}
            onSelect={onSelectStat}
          />
          <StatisticItems
            variant={variant}
            value={totalScans}
            title={
              intl.formatMessage(
                {
                  defaultMessage: 'Contact card{azzappA} scans',
                  description: 'Home statistics - Contact card scans label',
                },
                {
                  azzappA: <Text variant="azzapp">a</Text>,
                },
              ) as string
            }
            scrollIndex={scrollIndexOffset}
            index={1}
            onSelect={onSelectStat}
          />
          <StatisticItems
            variant={variant}
            value={totalLikes}
            title={intl.formatMessage({
              defaultMessage: 'Total Likes',
              description: 'Home statistics - Total Likes',
            })}
            scrollIndex={scrollIndexOffset}
            index={2}
            onSelect={onSelectStat}
          />
        </AnimatedScrollView>
      )}
      {mode === 'compact' && (
        <View
          style={{
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <StatisticItems
            variant={variant}
            value={totalScans}
            title={
              intl.formatMessage(
                {
                  defaultMessage: 'Contact card{azzappA} scans',
                  description: 'Home statistics - Contact card scans label',
                },
                {
                  azzappA: <Text variant="azzapp">a</Text>,
                },
              ) as string
            }
            scrollIndex={scrollIndexOffset}
            index={1}
            onSelect={onSelectStat}
          />
        </View>
      )}
    </View>
  );
};

const BOX_NUMBER_HEIGHT = 62.3;
const PADDING_HORIZONTAL = 20;
const BOX_NUMBER_WIDTH = 140;

export default HomeStatistics;

type StatisticItemsProps = {
  value: SharedValue<string>;
  scrollIndex: SharedValue<number>;
  title: string;
  index: number;
  onSelect: (index: number) => void;
  variant: 'dark' | 'light';
};
export const StatisticItems = ({
  value,
  scrollIndex,
  title,
  index,
  onSelect,
  variant = 'dark',
}: StatisticItemsProps) => {
  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(
            scrollIndex.value,
            [index - 1, index, index + 1],
            [0.35, 1, 0.35],
          ),
        },
        {
          translateY: interpolate(
            scrollIndex.value,
            [index - 1, index, index + 1],
            [36, 0, 36],
          ),
        },
      ],
    };
  }, [scrollIndex]);

  const animatedOpacity = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollIndex.value,
        [index - 1, index, index + 1],
        [0.3, 1, 0.3],
      ),
    };
  }, [scrollIndex]);

  const onPress = () => {
    onSelect(index);
  };

  const styles = useVariantStyleSheet(stylesheet, variant);

  return (
    <Animated.View style={[styles.boxContainer, animatedOpacity]}>
      <Pressable onPress={onPress} style={{ overflow: 'visible' }}>
        <AnimatedText
          style={[styles.largeText, animatedTextStyle]}
          text={value}
        />
        <Text variant="smallbold" style={styles.smallText}>
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const stylesheet = createVariantsStyleSheet(() => ({
  default: {
    boxContainer: {
      width: BOX_NUMBER_WIDTH,
      height: BOX_NUMBER_HEIGHT,
      justifyContent: 'flex-end',
      alignItems: 'center',
      overflow: 'visible',
    },
    container: {
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingHorizontal: PADDING_HORIZONTAL,
      width: '100%',
      overflow: 'visible',
      flex: 1,
    },
    largeText: {
      ...fontFamilies.extrabold,
      textAlign: 'center',
      fontSize: 40,
    },
    smallText: {
      textAlign: 'center',
    },
  },
  dark: {
    icon: {
      color: colors.white,
    },
    smallText: {
      color: colors.white,
    },
    largeText: {
      color: colors.white,
    },
  },
  light: {
    icon: {
      color: colors.black,
    },
    smallText: {
      color: colors.black,
    },
    largeText: {
      color: colors.black,
    },
  },
}));
