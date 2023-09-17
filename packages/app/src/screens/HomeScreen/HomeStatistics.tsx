import { memo, useMemo } from 'react';
import { useIntl } from 'react-intl';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
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
import Text from '#ui/Text';
import HomeStatisticsChart from './HomeStatisticsChart';
import type { StatsData, StatsDataGroup } from './HomeStatisticsChart';
import type { HomeStatistics_user$key } from '@azzapp/relay/artifacts/HomeStatistics_user.graphql';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

type HomeInformationsProps = {
  user: HomeStatistics_user$key;
  height: number;
  animated: boolean;
  currentProfileIndexSharedValue: SharedValue<number>;
  currentUserIndex: number;
};

const HomeStatistics = ({
  user,
  height,
  animated,
  currentUserIndex,
  currentProfileIndexSharedValue,
}: HomeInformationsProps) => {
  //TODO: backend part .
  const { profiles } = useFragment(
    graphql`
      fragment HomeStatistics_user on User {
        profiles {
          id
          statsSummary {
            date
            scans
            webcardViews
            totalLikes
          }
        }
      }
    `,
    user,
  );

  // Convert to have the correct type for matrix animation chart
  const chartsData = useMemo(() => {
    const result: Array<{ date: string; data: StatsData[] }> = [];
    if (profiles) {
      profiles.forEach(profile => {
        if (profile.statsSummary) {
          profile.statsSummary.forEach(stats => {
            if (stats) {
              const index = result.findIndex(item => item.date === stats.date);

              if (index === -1) {
                result.push({ date: stats.date, data: [stats] });
              } else {
                result[index].data.push(stats);
              }
            }
          });
        }
      });
      return result;
    }
    return [];
  }, [profiles]);

  const { width } = useWindowDimensions();
  const intl = useIntl();

  //TODO: use real data.Sum the value of the charts waiting for real data
  const sumValues = useMemo(
    () =>
      chartsData.reduce((acc: StatsData[], group: StatsDataGroup) => {
        group.data.forEach((data, index) => {
          if (!acc[index]) {
            acc[index] = { scans: 0, webcardViews: 0, totalLikes: 0 };
          }

          acc[index].scans += data.scans;
          acc[index].webcardViews += data.webcardViews;
          acc[index].totalLikes += data.totalLikes;
        });

        return acc;
      }, []),
    [chartsData],
  );

  const shareSums = useSharedValue(sumValues);

  const scrollIndexOffset = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollIndexOffset.value = event.contentOffset.x / BOX_NUMBER_WIDTH;
  });

  const totalLikes = useSharedValue(
    format(sumValues[currentUserIndex]?.totalLikes ?? 0),
  );
  const totalScans = useSharedValue(
    format(sumValues[currentUserIndex]?.scans ?? 0),
  );
  const totalViews = useSharedValue(
    format(sumValues[currentUserIndex]?.webcardViews ?? 0),
  );

  useAnimatedReaction(
    () => currentProfileIndexSharedValue.value,
    actual => {
      const prevIndex = Math.floor(actual);
      if (actual >= 0 && animated) {
        const nextIndex = Math.ceil(actual);
        const previous = shareSums.value[prevIndex] ?? 0;
        const next =
          shareSums.value[Math.min(nextIndex, shareSums.value.length - 1)] ?? 0;

        totalLikes.value = format(
          interpolate(
            currentProfileIndexSharedValue.value,
            [prevIndex, nextIndex],
            [previous.totalLikes, next.totalLikes],
          ),
        );
        totalScans.value = format(
          interpolate(
            currentProfileIndexSharedValue.value,
            [prevIndex, nextIndex],
            [previous.scans, next.scans],
          ),
        );
        totalViews.value = format(
          interpolate(
            currentProfileIndexSharedValue.value,
            [prevIndex, nextIndex],
            [previous.webcardViews, next.webcardViews],
          ),
        );
      } else if (actual >= 0 && !animated && Math.trunc(actual) === actual) {
        totalLikes.value = format(shareSums.value[prevIndex]?.totalLikes ?? 0);
        totalScans.value = format(shareSums.value[prevIndex]?.scans ?? 0);
        totalViews.value = format(
          shareSums.value[prevIndex]?.webcardViews ?? 0,
        );
      }
    },
    [currentProfileIndexSharedValue.value, animated],
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
        animated={animated}
        currentUserIndex={currentUserIndex}
        currentProfileIndexSharedValue={currentProfileIndexSharedValue}
        chartsData={chartsData}
      />
      <AnimatedScrollView
        ref={scrollViewRef}
        style={{
          height: BOX_NUMBER_HEIGHT,
          width: '100%',
          overflow: 'visible',
        }}
        pagingEnabled
        snapToInterval={BOX_NUMBER_WIDTH}
        decelerationRate="fast"
        snapToAlignment="start"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: (width - 2 * PADDING_HORIZONTAL - BOX_NUMBER_WIDTH) / 2,
          paddingRight: (width - 2 * PADDING_HORIZONTAL - BOX_NUMBER_WIDTH) / 2,
          overflow: 'visible',
        }}
        bounces={false}
        scrollEventThrottle={16}
        horizontal
        onScroll={scrollHandler}
      >
        <StatisticItems
          value={totalViews}
          title={intl.formatMessage({
            defaultMessage: 'Webcard Views',
            description: 'Home statistics - webcardView label',
          })}
          scrollIndex={scrollIndexOffset}
          index={0}
          onSelect={onSelectStat}
        />
        <StatisticItems
          value={totalScans}
          title={intl.formatMessage({
            defaultMessage: 'Contact card scans',
            description: 'Home statistics - Contact card scans label',
          })}
          scrollIndex={scrollIndexOffset}
          index={1}
          onSelect={onSelectStat}
        />
        <StatisticItems
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
    </View>
  );
};

const BOX_NUMBER_HEIGHT = 50;
const PADDING_HORIZONTAL = 20;
const BOX_NUMBER_WIDTH = 140;

export default memo(HomeStatistics);

type StatisticItemsProps = {
  value: SharedValue<string>;
  scrollIndex: SharedValue<number>;
  title: string;
  index: number;
  onSelect: (index: number) => void;
};
const StatisticItems = ({
  value,
  scrollIndex,
  title,
  index,
  onSelect,
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

  return (
    <Animated.View style={[styles.boxContainer, animatedOpacity]}>
      <Pressable onPress={onPress}>
        <AnimatedText
          style={[styles.largetText, animatedTextStyle]}
          text={value}
        />
        <Text variant="smallbold" style={styles.smallText}>
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
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
  largetText: {
    ...fontFamilies.extrabold,
    color: colors.white,
    fontSize: 44,
  },
  smallText: {
    color: colors.white,
    textAlign: 'center',
  },
});

const format = (value: number) => {
  'worklet';
  return Math.trunc(value).toString();
};
