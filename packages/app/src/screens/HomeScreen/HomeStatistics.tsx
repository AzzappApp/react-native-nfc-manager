import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  interpolate,
  useAnimatedStyle,
  useAnimatedRef,
  useDerivedValue,
} from 'react-native-reanimated';
import { useFragment, graphql } from 'react-relay';
import { colors, fontFamilies } from '#theme';
import AnimatedText from '#components/AnimatedText';
import ProfileStatisticsChart from '#components/ProfileStatisticsChart';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Text from '#ui/Text';
import { format } from './HomeInformations';
import { useHomeScreenCurrentIndex } from './HomeScreenContext';
import type { HomeStatistics_profiles$key } from '#relayArtifacts/HomeStatistics_profiles.graphql';
import type { DerivedValue } from 'react-native-reanimated';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

type HomeStatisticsProps = {
  user: HomeStatistics_profiles$key;
  height: number;
  initialStatsIndex?: number;
};

const HomeStatistics = ({
  user,
  height,
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

  const currentIndexSharedValue = useHomeScreenCurrentIndex();

  const { width } = useWindowDimensions();
  const intl = useIntl();

  const scrollIndexOffset = useSharedValue(initialStatsIndex);
  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollIndexOffset.value = event.contentOffset.x / BOX_NUMBER_WIDTH;
  });
  // cant use the context until we are splitting this screen from the multiuser
  const inputRange = useDerivedValue(
    () => Array.from({ length: (profiles?.length ?? 0) + 1 }, (_, i) => i),
    [profiles?.length],
  );

  const animatedData = useDerivedValue(() => {
    const likes = [
      0,
      ...(profiles?.map(profile => profile.webCard?.nbLikes ?? 0) ?? []),
    ];
    const contactCardScans = [
      0,
      ...(profiles?.map(profile => profile.nbContactCardScans ?? 0) ?? []),
    ];
    const shareBacks = [
      0,
      ...(profiles?.map(profile => profile.nbShareBacks ?? 0) ?? []),
    ];
    const webCardViews = [
      0,
      ...(profiles?.map(profile => profile.webCard?.nbWebCardViews ?? 0) ?? []),
    ];
    const actual = currentIndexSharedValue?.value ?? 1;
    if (actual >= 0 && inputRange && inputRange.value.length > 1) {
      return {
        totalLikes: likes[Math.round(currentIndexSharedValue?.value ?? 0)],
        totalScans:
          contactCardScans[Math.round(currentIndexSharedValue?.value ?? 0)],
        totalViews:
          webCardViews[Math.round(currentIndexSharedValue?.value ?? 0)],
        totalShareBacks:
          shareBacks[Math.round(currentIndexSharedValue?.value ?? 0)],
      };
    } else if (actual >= 0) {
      return {
        totalLikes: likes[actual],
        totalScans: contactCardScans[actual],
        totalViews: webCardViews[actual],
        totalShareBacks: shareBacks[actual],
      };
    }
    return {
      totalLikes: 0,
      totalScans: 0,
      totalViews: 0,
      totalShareBacks: 0,
    };
  });

  const chartsData = useMemo(() => {
    if (profiles) {
      const result = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setUTCDate(date.getUTCDate() - 29 + i); // Adjust the date to get the last 30 days
        const utcDate = new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
          ),
        );
        return {
          day: utcDate.toISOString(),
          data: Array.from({ length: profiles?.length ?? 0 }, () => ({
            contactCardScans: 0,
            webCardViews: 0,
            likes: 0,
            shareBacks: 0,
          })),
        };
      });

      profiles.forEach((profile, indexProfile) => {
        profile.statsSummary?.forEach(stats => {
          if (stats) {
            const index = result.findIndex(item => item.day === stats.day);
            if (index !== -1) {
              Object.assign(result[index].data[indexProfile], {
                ...stats,
              });
            }
          }
        });
        profile.webCard?.statsSummary?.forEach(stats => {
          if (stats) {
            const index = result.findIndex(item => item.day === stats.day);

            if (index !== -1) {
              result[index].data[indexProfile] = {
                ...result[index].data[indexProfile],
                webCardViews: stats.webCardViews,
                likes: stats.likes,
              };
            }
          }
        });
      });
      return result;
    }
    return [];
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

    return chartsData.map(item => {
      const previousProfileData = item.data[previousProfileIndex];
      const nextProfileData = item.data[nextProfileIndex];
      const previousProfileValue = interpolate(
        scrollIndexInterPolationValue,
        [0, 1],
        [
          previousProfileData[previousScrollIndexProp],
          previousProfileData[nextScrollIndexProp],
        ],
      );
      const nextProfileValue = interpolate(
        scrollIndexInterPolationValue,
        [0, 1],
        [
          nextProfileData[previousScrollIndexProp],
          nextProfileData[nextScrollIndexProp],
        ],
      );
      return interpolate(
        profileIndexInterPolationValue,
        [0, 1],
        [previousProfileValue, nextProfileValue],
      );
    });
  });

  const totalLikes = useDerivedValue(
    () => format(animatedData.value.totalLikes) ?? '0',
  );
  const totalScans = useDerivedValue(
    () => format(animatedData.value.totalScans) ?? '0',
  );
  const totalViews = useDerivedValue(
    () => format(animatedData.value.totalViews) ?? '0',
  );
  const totalShareBacks = useDerivedValue(
    () => format(animatedData.value.totalShareBacks) ?? '0',
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
          value={totalScans}
          title={
            intl.formatMessage(
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
            ) as string
          }
          scrollIndex={scrollIndexOffset}
          index={1}
          onSelect={onSelectStat}
        />
        <StatisticItems
          value={totalShareBacks}
          title={intl.formatMessage({
            defaultMessage: 'ShareBacks',
            description: 'Home statistics - Share backs label',
          })}
          scrollIndex={scrollIndexOffset}
          index={2}
          onSelect={onSelectStat}
        />
        <StatisticItems
          value={totalLikes}
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

type StatisticItemsProps = {
  value: DerivedValue<string>;
  scrollIndex: DerivedValue<number>;
  title: string;
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

  const styles = useStyleSheet(stylesheet);

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
