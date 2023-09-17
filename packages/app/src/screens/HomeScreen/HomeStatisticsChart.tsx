import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { colors } from '#theme';
import type { SharedValue } from 'react-native-reanimated';

type HomeStatisticsChartProps = {
  width: number;
  height: number;
  statsScrollIndex: SharedValue<number>;
  animated: boolean;
  currentProfileIndexSharedValue: SharedValue<number>;
  currentUserIndex: number;
  chartsData: StatsDataGroup[];
};
// * TODO: using SKIA here would have been great, but need to be validated by dev team.
// Until we have reanimated3, some part of skia a running on JS thread , so can wait
const HomeStatisticsChart = ({
  width,
  height,
  statsScrollIndex,
  animated,
  currentProfileIndexSharedValue,
  currentUserIndex,
  chartsData,
}: HomeStatisticsChartProps) => {
  const chartBarWidth = useMemo(() => {
    return width / 30;
  }, [width]);

  const flattenedMaxValue = useMemo(() => {
    const filtered = chartsData.reduce((acc: StatsData[], group) => {
      group.data.forEach((data, index) => {
        if (!acc[index]) {
          acc[index] = { scans: 0, webcardViews: 0, totalLikes: 0 };
        }

        acc[index].scans = Math.max(acc[index].scans, data.scans);
        acc[index].webcardViews = Math.max(
          acc[index].webcardViews,
          data.webcardViews,
        );
        acc[index].totalLikes = Math.max(
          acc[index].totalLikes,
          data.totalLikes,
        );
      });

      return acc;
    }, []);
    return filtered.flatMap(obj => [
      obj.webcardViews,
      obj.scans,
      obj.totalLikes,
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

  return (
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
                animated={animated}
                currentProfileIndexSharedValue={currentProfileIndexSharedValue}
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
  animated: boolean;
  currentProfileIndexSharedValue: SharedValue<number>;
  currentUserIndex: number;
};
const AnimatedBarChartItem = ({
  item,
  statsIndex,
  statsScrollIndex,
  currentProfileIndexSharedValue,
  chartBarWidth,
  maxValues,
  animated,
  currentUserIndex,
}: AnimatedBarChartItemProps) => {
  //we need to flatten the matrixTransform, cannot find a way to interpolate a matrix
  const flattenedData = item.data.flatMap(obj => [
    obj.webcardViews,
    obj.scans,
    obj.totalLikes,
  ]);
  const animatedStyle = useAnimatedStyle(() => {
    const currentValue = flattenedData[currentUserIndex * 3 + statsIndex];
    const currentMax = maxValues[currentUserIndex * 3 + statsIndex];
    if (animated) {
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

      const max = maxValuePanel + maxValueProfile - currentMax;

      return {
        height: `${
          ((interpolateValueProfile + interpolateValuePanel - currentValue) /
            max) *
          100
        }%`,
      };
    } else {
      return {
        height: `${(currentValue / currentMax) * 100}%`,
      };
    }
  });
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
            backgroundColor: colors.white,
            borderTopLeftRadius: chartBarWidth / 2,
            borderTopRightRadius: chartBarWidth / 2,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};
const AnimatedBarChart = memo(AnimatedBarChartItem);

export type StatsData = {
  scans: number;
  webcardViews: number;
  totalLikes: number;
};

export type StatsDataGroup = {
  date: string;
  data: StatsData[];
};
