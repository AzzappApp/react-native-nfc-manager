import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  interpolate,
  useAnimatedRef,
  useDerivedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useFragment, graphql } from 'react-relay';
import { colors, fontFamilies } from '#theme';
import ProfileStatisticsChart, {
  normalizeArray,
} from '#components/ProfileStatisticsChart';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Text from '#ui/Text';
import type { HomeStatistics_profile$key } from '#relayArtifacts/HomeStatistics_profile.graphql';
import type { ReactNode } from 'react';
import type { SharedValue } from 'react-native-reanimated';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

type HomeStatisticsProps = {
  user: HomeStatistics_profile$key | null | undefined;
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
  const profile = useFragment(
    graphql`
      fragment HomeStatistics_profile on Profile {
        webCard {
          nbWebCardViews
          statsSummary {
            day
            webCardViews
          }
        }
        nbContactCardScans
        nbContactsImportFromScan
        nbShareBacks
        statsSummary {
          day
          contactCardScans
          shareBacks
          contactsImportFromScan
        }
      }
    `,
    user,
  );

  const { width } = useWindowDimensions();
  const intl = useIntl();

  const scrollIndexOffset = useSharedValue(initialStatsIndex);
  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollIndexOffset.value = event.contentOffset.x / BOX_NUMBER_WIDTH;
  });

  const chartsData = useMemo(() => {
    if (!profile) {
      return {};
    }
    const days = dayRange.map(i => {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - 29 + i); // Adjust the date to get the last 30 days
      const utcDate = new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
      );
      return utcDate.toISOString();
    });

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
      contactsImportFromScan: normalizeArray(
        profileStatsByDays.map(stats => stats?.contactsImportFromScan ?? 0),
      ),
      shareBacks: normalizeArray(
        profileStatsByDays.map(stats => stats?.shareBacks ?? 0),
      ),
    };
  }, [profile]);

  const animatedChartData = useDerivedValue(() => {
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
    if (!chartsData) {
      return dayRange.map(() => 0);
    }
    return dayRange.map(index => {
      return interpolate(
        scrollIndexInterPolationValue,
        [0, 1],
        [
          chartsData[previousScrollIndexProp]?.[index] ?? 0,
          chartsData[nextScrollIndexProp]?.[index] ?? 0,
        ],
      );
    });
  });

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
          value={format(profile?.nbContactCardScans ?? 0)}
          title={intl.formatMessage({
            defaultMessage: 'Contact shares',
            description: 'Home statistics - Contact shares label',
          })}
          scrollIndex={scrollIndexOffset}
          index={0}
          onSelect={onSelectStat}
        />
        <StatisticItems
          value={format(profile?.nbShareBacks ?? 0)}
          title={intl.formatMessage({
            defaultMessage: 'Contacts received',
            description: 'Home statistics - Contacts received label',
          })}
          scrollIndex={scrollIndexOffset}
          index={1}
          onSelect={onSelectStat}
        />
        <StatisticItems
          value={format(profile?.webCard?.nbWebCardViews ?? 0)}
          title={intl.formatMessage({
            defaultMessage: 'Profile views',
            description: 'Home statistics - Profile views label',
          })}
          scrollIndex={scrollIndexOffset}
          index={2}
          onSelect={onSelectStat}
        />
        <StatisticItems
          value={format(profile?.nbContactsImportFromScan ?? 0)}
          title={intl.formatMessage({
            defaultMessage: 'Scans',
            description:
              'Home statistics - Total Contacts imported from scan label',
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
  value: string;
  title: ReactNode;
  index: number;
  onSelect: (index: number) => void;
  scrollIndex: SharedValue<number>;
};

export const StatisticItems = ({
  value,
  title,
  index,
  onSelect,
  scrollIndex,
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
        <Animated.View style={animatedTextStyle}>
          <Text style={styles.largeText} selectable={false}>
            {value}
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
}));

const STATISTICS_ORDER = [
  'contactCardScans',
  'shareBacks',
  'webCardViews',
  'contactsImportFromScan',
] as const;

export const format = (value: number) => {
  'worklet';
  if (typeof value === 'number') {
    return Math.round(value).toString();
  }
  return '0';
};
