import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { View } from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useFragment, graphql } from 'react-relay';
import { colors } from '#theme';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import Text from '#ui/Text';
import type { HomeStatisticsChart_profiles$key } from '@azzapp/relay/artifacts/HomeStatisticsChart_profiles.graphql';
import type { SharedValue } from 'react-native-reanimated';

type HomeStatisticsChartProps = {
  user: HomeStatisticsChart_profiles$key;
  width: number;
  height: number;
  statsScrollIndex: SharedValue<number>;
  currentProfileIndexSharedValue: SharedValue<number>;
  currentUserIndex: number;
  variant?: 'primary' | 'secondary';
};
// * TODO: using SKIA here would have been great, but need to be validated by dev team.
// Until we have reanimated3, some part of skia a running on JS thread , so can wait
const HomeStatisticsChart = ({
  user,
  width,
  height,
  statsScrollIndex,
  currentProfileIndexSharedValue,
  currentUserIndex,
  variant = 'primary',
}: HomeStatisticsChartProps) => {
  const profiles = useFragment(
    graphql`
      fragment HomeStatisticsChart_profiles on Profile @relay(plural: true) {
        statsSummary {
          day
          contactCardScans
        }
        webCard {
          statsSummary {
            day
            webCardViews
            likes
          }
        }
      }
    `,
    user,
  );

  // Convert to have the correct type for matrix animation chart
  const chartsData = useMemo(() => {
    if (profiles) {
      const result = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(new Date().toISOString().split('T')[0]);
        d.setDate(d.getDate() - 30 + i + 1);

        return {
          day: d.toISOString(),
          data: Array(profiles?.length ?? 0).fill({
            contactcardScans: 0,
            webCardViews: 0,
            likes: 0,
          }),
        };
      });
      profiles.forEach((profile, indexProfile) => {
        if (profile.statsSummary) {
          profile.statsSummary.forEach(stats => {
            if (stats) {
              const index = result.findIndex(item => item.day === stats.day);
              //find the stats in webcard stats for the day

              result[index].data[indexProfile] = stats;
            }
          });
          profile.webCard?.statsSummary?.forEach(stats => {
            if (stats) {
              const index = result.findIndex(item => item.day === stats.day);
              //find the stats in webcard stats for the day
              result[index].data[indexProfile] = {
                ...result[index].data[indexProfile],
                webCardViews: stats.webCardViews,
                likes: stats.likes,
              };
            }
          });
        }
      });
      return result;
    }
    return [];
  }, [profiles]);

  const chartBarWidth = useMemo(() => {
    return width / 30;
  }, [width]);

  const flattenedMaxValue = useMemo(() => {
    const filtered = chartsData.reduce((acc: StatsData[], group) => {
      group.data.forEach((data, index) => {
        if (!acc[index]) {
          acc[index] = { contactcardScans: 0, webCardViews: 0, likes: 0 };
        }

        acc[index].contactcardScans = Math.max(
          acc[index].contactcardScans,
          data.contactcardScans,
        );
        acc[index].webCardViews = Math.max(
          acc[index].webCardViews,
          data.webCardViews,
        );
        acc[index].likes = Math.max(acc[index].likes, data.likes);
      });

      return acc;
    }, []);
    return filtered.flatMap(obj => [
      obj.webCardViews,
      obj.contactcardScans,
      obj.likes,
    ]);
  }, [chartsData]);

  const [currentStatsIndex, setCurrentStateIndex] = useState(0);
  useAnimatedReaction(
    () => statsScrollIndex.value,
    current => {
      runOnJS(setCurrentStateIndex)(Math.trunc(current));
    },
    [statsScrollIndex],
  );

  const intl = useIntl();

  const displayedDate = useMemo(() => {
    const dayInterval = 5;
    const startDate = new Date(new Date().toISOString().split('T')[0]);
    startDate.setDate(startDate.getDate() - 30 + 1);
    const result = [];
    for (let index = 0; index < 6; index++) {
      if ((index * dayInterval) % (3 * dayInterval) === 0) {
        const currentMonth = intl.formatDate(startDate, { month: 'short' });
        result.push(`${startDate.getDate()}${currentMonth}`);
      } else {
        result.push(`${startDate.getDate()}`);
      }
      startDate.setDate(startDate.getDate() + dayInterval);
    }

    return result;
  }, [intl]);

  const styles = useVariantStyleSheet(stylesheet, variant);

  return (
    <View>
      <MaskedView
        style={{
          width,
          height,
          overflow: 'visible',
        }}
        maskElement={
          <View
            style={{
              width,
              height,
              flexDirection: 'row',
              overflow: 'visible',
              alignItems: 'flex-end',
            }}
          >
            {chartsData.map((item, index) => {
              return (
                <AnimatedBarChart
                  item={item}
                  maxValues={flattenedMaxValue}
                  chartBarWidth={chartBarWidth}
                  key={`statistic_chart_${index}`}
                  statsScrollIndex={statsScrollIndex}
                  statsIndex={currentStatsIndex}
                  currentProfileIndexSharedValue={
                    currentProfileIndexSharedValue
                  }
                  currentUserIndex={currentUserIndex}
                />
              );
            })}
          </View>
        }
      >
        <LinearGradient
          colors={[colors.white, '#ffffff00']}
          style={{
            width,
            height,
            flexDirection: 'row',
            alignItems: 'flex-end',
          }}
        />
      </MaskedView>
      <View style={[styles.dateContainer, { width, height }]}>
        {displayedDate.map((date, index) => (
          <Text
            key={date}
            variant="xsmall"
            style={[styles.textDate, { left: index * 5 * chartBarWidth }]}
          >
            {date}
          </Text>
        ))}
      </View>
    </View>
  );
};
export default memo(HomeStatisticsChart);

export const CHART_BAR_SEPARATOR = 2;
type AnimatedBarChartItemProps = {
  item: StatsDataGroup;
  maxValues: number[];
  chartBarWidth: number;
  statsIndex: number;
  statsScrollIndex: SharedValue<number>;
  currentProfileIndexSharedValue: SharedValue<number>;
  currentUserIndex: number;
  variant?: 'primary' | 'secondary';
};
const AnimatedBarChartItem = ({
  item,
  statsIndex,
  statsScrollIndex,
  currentProfileIndexSharedValue,
  chartBarWidth,
  maxValues,
  currentUserIndex,
  variant = 'primary',
}: AnimatedBarChartItemProps) => {
  //we need to flatten the matrixTransform, cannot find a way to interpolate a matrix
  const flattenedData = item.data.flatMap(obj => [
    obj.webCardViews,
    obj.contactcardScans,
    obj.likes,
  ]);
  const animatedStyle = useAnimatedStyle(() => {
    const currentValue = flattenedData[currentUserIndex * 3 + statsIndex];
    const currentMax = maxValues[currentUserIndex * 3 + statsIndex];

    const interpolateValuePanel = interpolate(
      statsScrollIndex.value,
      [statsIndex - 1, statsIndex, statsIndex + 1],
      [
        flattenedData[currentUserIndex * 3 + statsIndex - 1] ?? 0,
        currentValue,
        flattenedData[currentUserIndex * 3 + statsIndex + 1] ?? 0,
      ],
    );

    const interpolateValueProfile = interpolate(
      currentProfileIndexSharedValue.value * 3,
      [
        (currentUserIndex - 1) * 3,
        currentUserIndex * 3,
        (currentUserIndex + 1) * 3,
      ],
      [
        flattenedData[(currentUserIndex - 1) * 3 + statsIndex] ?? 0,
        currentValue,
        flattenedData[(currentUserIndex + 1) * 3 + statsIndex] ?? 0,
      ],
    );

    const maxValuePanel = interpolate(
      statsScrollIndex.value,
      [statsIndex - 1, statsIndex, statsIndex + 1],
      [
        maxValues[currentUserIndex * 3 + statsIndex - 1] ?? 0,
        currentMax,
        maxValues[currentUserIndex * 3 + statsIndex + 1] ?? 0,
      ],
    );

    const maxValueProfile = interpolate(
      currentProfileIndexSharedValue.value * 3,
      [
        (currentUserIndex - 1) * 3,
        currentUserIndex * 3,
        (currentUserIndex + 1) * 3,
      ],
      [
        maxValues[(currentUserIndex - 1) * 3 + statsIndex] ?? 0,
        currentMax,
        maxValues[(currentUserIndex + 1) * 3 + statsIndex] ?? 0,
      ],
    );

    const max = Math.max(1, maxValuePanel + maxValueProfile - currentMax); //Avoid max =0, division by zero what broke animation transition

    return {
      height: `${
        ((interpolateValueProfile + interpolateValuePanel - currentValue) /
          max) *
          95 +
        5
      }%`,
    };
  });
  const styles = useVariantStyleSheet(stylesheet, variant);

  return (
    <View
      style={{
        flexDirection: 'column-reverse',
        marginRight: CHART_BAR_SEPARATOR,
      }}
    >
      <Animated.View
        style={[
          {
            width: chartBarWidth - CHART_BAR_SEPARATOR,
            borderTopLeftRadius: chartBarWidth / 2,
            borderTopRightRadius: chartBarWidth / 2,
          },
          styles.barTop,
        ]}
      />
      <Animated.View
        style={[
          {
            width: chartBarWidth - CHART_BAR_SEPARATOR,
            borderTopLeftRadius: chartBarWidth / 2,
            borderTopRightRadius: chartBarWidth / 2,
          },
          animatedStyle,
          styles.bar,
        ]}
      />
    </View>
  );
};
const AnimatedBarChart = memo(AnimatedBarChartItem);

export type StatsData = {
  contactcardScans: number;
  webCardViews: number;
  likes: number;
};

export type StatsDataGroup = {
  day: string;
  data: StatsData[];
};

const stylesheet = createVariantsStyleSheet(() => ({
  default: {
    textDate: {
      opacity: 0.4,
      fontSize: 9,
      position: 'absolute',
      bottom: 0,
    },
    dateContainer: {
      position: 'absolute',
      bottom: 0,
    },
    barTop: {
      height: '5%',
      position: 'absolute',
    },
  },
  primary: {
    textDate: {
      color: colors.white,
    },
    bar: {
      backgroundColor: colors.white,
    },
    barTop: {
      backgroundColor: colors.white,
    },
  },
  secondary: {
    textDate: {
      color: colors.black,
    },
    bar: {
      backgroundColor: colors.black,
    },
    barTop: {
      backgroundColor: colors.black,
    },
  },
}));
