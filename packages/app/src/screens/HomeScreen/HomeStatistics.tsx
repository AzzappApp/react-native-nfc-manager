import concat from 'lodash/concat';
import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  interpolate,
  useAnimatedStyle,
  useAnimatedRef,
  useDerivedValue,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import { useFragment, graphql } from 'react-relay';
import { colors, fontFamilies } from '#theme';
import ProfileStatisticsChart, {
  normalizeArray,
} from '#components/ProfileStatisticsChart';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Text from '#ui/Text';
import { useIndexInterpolation } from './homeHelpers';
import { useHomeScreenContext } from './HomeScreenContext';
import type { HomeStatistics_profiles$key } from '#relayArtifacts/HomeStatistics_profiles.graphql';
import type { ReactNode } from 'react';
import type { DerivedValue } from 'react-native-reanimated';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

type HomeStatisticsProps = {
  user: HomeStatistics_profiles$key;
  height: number;
  focused: boolean;
  initialStatsIndex?: number;
};

const HomeStatistics = ({
  user,
  height,
  focused,
  initialStatsIndex = 0,
}: HomeStatisticsProps) => {
  const profiles = useFragment(
    graphql`
      fragment HomeStatistics_profiles on Profile @relay(plural: true) {
        id
        webCard {
          id
          nbLikes
          nbWebCardViews
          userName
          statsSummary {
            day
            webCardViews
            likes
          }
        }
        nbContactCardScans
        nbShareBacks
        statsSummary {
          day
          contactCardScans
          shareBacks
        }
      }
    `,
    user,
  );

  const { currentIndexSharedValue, currentIndexProfileSharedValue } =
    useHomeScreenContext();

  const { width } = useWindowDimensions();
  const intl = useIntl();

  const scrollIndexOffset = useSharedValue(initialStatsIndex);
  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollIndexOffset.value = event.contentOffset.x / BOX_NUMBER_WIDTH;
  });

  const chartsData = useMemo(() => {
    if (!profiles) {
      return [];
    }
    const days = dayRange.map(i => {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - 29 + i); // Adjust the date to get the last 30 days
      const utcDate = new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
      );
      return utcDate.toISOString();
    });

    return profiles?.map(profile => {
      const profileStatsByDays = days.map(day =>
        profile.statsSummary?.find(stats => stats.day === day),
      );
      const webCardStatsByDay = days.map(day =>
        profile.webCard?.statsSummary?.find(stats => stats.day === day),
      );

      return {
        contactCardScans: normalizeArray(
          profileStatsByDays.map(stats => stats?.contactCardScans ?? 0),
        ),
        webCardViews: normalizeArray(
          webCardStatsByDay.map(stats => stats?.webCardViews ?? 0),
        ),
        likes: normalizeArray(
          webCardStatsByDay.map(stats => stats?.likes ?? 0),
        ),
        shareBacks: normalizeArray(
          profileStatsByDays.map(stats => stats?.shareBacks ?? 0),
        ),
      };
    });
  }, [profiles]);

  const animatedChartData = useDerivedValue(() => {
    const profileIndex = Math.max((currentIndexSharedValue?.value ?? 1) - 1, 0);

    const previousProfileIndex = Math.max(Math.floor(profileIndex), 0);
    const nextProfileIndex = Math.min(
      Math.ceil(profileIndex),
      profiles.length - 1,
    );
    const profileIndexInterPolationValue = profileIndex - previousProfileIndex;

    const previousScrollIndex = Math.max(
      Math.floor(scrollIndexOffset.value),
      0,
    );
    const nextScrollIndex = Math.min(
      Math.ceil(scrollIndexOffset.value),
      STATISTICS_ORDER.length - 1,
    );
    const scrollIndexInterPolationValue =
      scrollIndexOffset.value - previousScrollIndex;
    const previousScrollIndexProp = STATISTICS_ORDER[previousScrollIndex];
    const nextScrollIndexProp = STATISTICS_ORDER[nextScrollIndex];

    const previousProfileData = chartsData[previousProfileIndex];
    const nextProfileData = chartsData[nextProfileIndex];

    if (!previousProfileData || !nextProfileData) {
      const data = previousProfileData ?? nextProfileData;
      if (!data) {
        return dayRange.map(() => 0);
      }
      return dayRange.map(index => {
        return interpolate(
          profileIndexInterPolationValue,
          [0, 1],
          [
            data[previousScrollIndexProp][index],
            data[nextScrollIndexProp][index],
          ],
        );
      });
    }

    return dayRange.map(index => {
      const previousProfileValue = interpolate(
        scrollIndexInterPolationValue,
        [0, 1],
        [
          previousProfileData[previousScrollIndexProp][index],
          previousProfileData[nextScrollIndexProp][index],
        ],
      );
      const nextProfileValue = interpolate(
        scrollIndexInterPolationValue,
        [0, 1],
        [
          nextProfileData[previousScrollIndexProp][index],
          nextProfileData[nextScrollIndexProp][index],
        ],
      );
      return interpolate(
        profileIndexInterPolationValue,
        [0, 1],
        [previousProfileValue, nextProfileValue],
      );
    });
  });

  const totalLikes = useIndexInterpolation(
    currentIndexProfileSharedValue,
    concat(0, profiles?.map(profile => profile.webCard?.nbLikes ?? 0) ?? []),
    0,
  );
  const totalLikesLabel = useDerivedValue(() => format(totalLikes.value));
  const totalScans = useIndexInterpolation(
    currentIndexProfileSharedValue,
    concat(0, profiles?.map(profile => profile.nbContactCardScans ?? 0) ?? []),
    0,
  );
  const totalScansLabel = useDerivedValue(() => format(totalScans.value));
  const totalViews = useIndexInterpolation(
    currentIndexProfileSharedValue,
    concat(
      0,
      profiles?.map(profile => profile.webCard?.nbWebCardViews ?? 0) ?? [],
    ),
    0,
  );
  const totalViewsLabel = useDerivedValue(() => format(totalViews.value));
  const totalShareBacks = useIndexInterpolation(
    currentIndexProfileSharedValue,
    concat(0, profiles?.map(profile => profile.nbShareBacks ?? 0) ?? []),
    0,
  );
  const totalShareBacksLabel = useDerivedValue(() =>
    format(totalShareBacks.value),
  );

  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();

  const onSelectStat = useCallback(
    (index: number) => {
      scrollViewRef?.current?.scrollTo({ x: index * BOX_NUMBER_WIDTH, y: 0 });
    },
    [scrollViewRef],
  );

  const styles = useStyleSheet(stylesheet);

  return (
    <View style={styles.container}>
      <ProfileStatisticsChart
        width={width - 2 * PADDING_HORIZONTAL}
        height={height - BOX_NUMBER_HEIGHT - 5}
        data={animatedChartData}
        variant="dark"
        visible={focused}
      />
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
          paddingLeft: (width - 2 * PADDING_HORIZONTAL - BOX_NUMBER_WIDTH) / 2,
          paddingRight: (width - 2 * PADDING_HORIZONTAL - BOX_NUMBER_WIDTH) / 2,
          overflow: 'visible',
          height: BOX_NUMBER_HEIGHT,
        }}
        bounces={false}
        scrollEventThrottle={16}
        horizontal
        onScroll={scrollHandler}
        contentOffset={{ x: initialStatsIndex * BOX_NUMBER_WIDTH, y: 0 }}
        overScrollMode="never"
      >
        <StatisticItems
          value={totalViewsLabel}
          title={intl.formatMessage(
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
          )}
          scrollIndex={scrollIndexOffset}
          index={0}
          onSelect={onSelectStat}
        />
        <StatisticItems
          value={totalScansLabel}
          title={intl.formatMessage(
            {
              defaultMessage: 'Contact card{azzappA} views',
              description: 'Home statistics - Contact card views label',
            },
            {
              azzappA: (
                <Text variant="azzapp" style={styles.icon}>
                  a
                </Text>
              ),
            },
          )}
          scrollIndex={scrollIndexOffset}
          index={1}
          onSelect={onSelectStat}
        />
        <StatisticItems
          value={totalShareBacksLabel}
          title={intl.formatMessage({
            defaultMessage: 'ShareBacks',
            description: 'Home statistics - Share backs label',
          })}
          scrollIndex={scrollIndexOffset}
          index={2}
          onSelect={onSelectStat}
        />
        <StatisticItems
          value={totalLikesLabel}
          title={intl.formatMessage({
            defaultMessage: 'Total Likes',
            description: 'Home statistics - Total Likes',
          })}
          scrollIndex={scrollIndexOffset}
          index={3}
          onSelect={onSelectStat}
        />
      </AnimatedScrollView>
    </View>
  );
};

const BOX_NUMBER_HEIGHT = 62.3;
const PADDING_HORIZONTAL = 20;
const BOX_NUMBER_WIDTH = 140;

export default HomeStatistics;

const dayRange = Array.from({ length: 30 }, (_, i) => i);

type StatisticItemsProps = {
  value: DerivedValue<string>;
  scrollIndex: DerivedValue<number>;
  title: ReactNode;
  index: number;
  onSelect: (index: number) => void;
};

export const StatisticItems = ({
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
  });

  const animatedOpacity = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollIndex.value,
        [index - 1, index, index + 1],
        [0.3, 1, 0.3],
      ),
    };
  });

  const onPress = () => {
    onSelect(index);
  };

  const [text, setText] = useState(() => value.value);
  useAnimatedReaction(
    () => value.value,
    newValue => {
      runOnJS(setText)(newValue);
    },
    [value],
  );

  const styles = useStyleSheet(stylesheet);

  return (
    <Animated.View style={[styles.boxContainer, animatedOpacity]}>
      <Pressable onPress={onPress} style={{ overflow: 'visible' }}>
        <Animated.View style={animatedTextStyle}>
          <Text style={styles.largeText} selectable={false}>
            {text}
          </Text>
        </Animated.View>
        <Text variant="smallbold" style={styles.smallText} selectable={false}>
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const stylesheet = createStyleSheet(() => ({
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
    width: '100%',
    overflow: 'visible',
    flex: 1,
  },
  largeText: {
    ...fontFamilies.extrabold,
    textAlign: 'center',
    fontSize: 40,
    lineHeight: 40,
    color: colors.white,
  },
  smallText: {
    textAlign: 'center',
    color: colors.white,
  },
  icon: {
    color: colors.white,
  },
}));

const STATISTICS_ORDER = [
  'webCardViews',
  'contactCardScans',
  'shareBacks',
  'likes',
] as const;

export const format = (value: number) => {
  'worklet';
  if (typeof value === 'number') {
    return Math.round(value).toString();
  }
  return '0';
};
