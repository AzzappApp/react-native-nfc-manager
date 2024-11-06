import {
  Canvas,
  createPicture,
  Picture,
  Skia,
  TileMode,
} from '@shopify/react-native-skia';
import { memo, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { View } from 'react-native';
import { useDerivedValue } from 'react-native-reanimated';
import { colors } from '#theme';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import Text from '#ui/Text';
import type { DerivedValue } from 'react-native-reanimated';

type ProfileStatisticsChartProps = {
  /**
   * The data to display in the chart, must be normalized between 0 and 1
   */
  data: DerivedValue<number[]> | number[];
  /**
   * The width of the chart
   */
  width: number;
  /**
   * The height of the chart
   */
  height: number;
  /**
   * The variant of the chart (dark or light)
   */
  variant?: 'dark' | 'light';
};

const ProfileStatisticsChart = ({
  data,
  width,
  height,
  variant = 'dark',
}: ProfileStatisticsChartProps) => {
  // For the moment we always display the last 30 days
  // however if at a given point we want to display more or less
  // we can make startDate and nbDates as props and eventually NB_DATE_DISPLAYED
  const startDate = useMemo(() => {
    const startDate = new Date(new Date().toISOString().split('T')[0]);
    startDate.setDate(startDate.getDate() - 30 + 5);
    return startDate.getTime();
  }, []);
  return (
    <View style={{ width, height }}>
      <BarChart variant={variant} data={data} width={width} height={height} />
      <BarChartLegend
        variant={variant}
        nbDates={30}
        startDate={startDate}
        width={width}
        height={height}
      />
    </View>
  );
};

export default memo(ProfileStatisticsChart);

const BarChart = ({
  data: propData,
  width,
  height,
  variant = 'dark',
}: {
  data: DerivedValue<number[]> | number[];
  width: number;
  height: number;
  variant?: 'dark' | 'light';
}) => {
  const picture = useDerivedValue(() => {
    const data = Array.isArray(propData) ? propData : propData.value;
    const barWidth =
      (width - CHART_BAR_SEPARATOR * (data.length - 1)) / data.length;

    return createPicture(
      canvas => {
        canvas.clear(Skia.Color('#00000000'));
        const paint = Skia.Paint();
        // paint.setColor(Skia.Color('#ffffff'));
        paint.setShader(
          Skia.Shader.MakeLinearGradient(
            { x: 0, y: 0 },
            { x: 0, y: height },
            variant === 'dark'
              ? [Skia.Color('#FFFFFFFF'), Skia.Color('#FFFFFF00')]
              : [Skia.Color(colors.black), Skia.Color('#FFFFFFFF')],
            null,
            TileMode.Clamp,
          ),
        );

        data.forEach((value, index) => {
          const barHeight = 0.05 * height + value * (height * 0.9);
          const x = index * (barWidth + CHART_BAR_SEPARATOR);
          const y = height - barHeight;
          canvas.drawRRect(
            {
              rect: { x, y, width: barWidth, height: barHeight },
              topLeft: { x: barWidth / 2, y: barWidth / 2 },
              topRight: { x: barWidth / 2, y: barWidth / 2 },
              bottomLeft: { x: 0, y: 0 },
              bottomRight: { x: 0, y: 0 },
            },
            paint,
          );
        });
      },
      {
        x: 0,
        y: 0,
        width,
        height,
      },
    );
  }, [propData, width, height]);

  return (
    <Canvas style={{ width, height }}>
      <Picture picture={picture} />
    </Canvas>
  );
};

const BarChartLegend = ({
  nbDates,
  startDate: startDateTimestamp,
  width,
  height,
  variant,
}: {
  nbDates: number;
  startDate: number;
  width: number;
  height: number;
  variant: 'dark' | 'light';
}) => {
  const styles = useVariantStyleSheet(stylesheet, variant);
  const intl = useIntl();

  const displayedDate = useMemo(() => {
    const startDate = new Date(startDateTimestamp);
    const result = [];
    const dayInterval = nbDates / NB_DATE_DISPLAYED;
    for (let index = 0; index < NB_DATE_DISPLAYED; index++) {
      if (
        (index * dayInterval) % ((NB_DATE_DISPLAYED / 2) * dayInterval) ===
        0
      ) {
        const currentMonth = intl.formatDate(startDate, { month: 'short' });
        result.push(`${startDate.getDate()}${currentMonth}`);
      } else {
        result.push(`${startDate.getDate()}`);
      }
      startDate.setDate(startDate.getDate() + dayInterval);
    }

    return result;
  }, [intl, nbDates, startDateTimestamp]);

  const chartBarWidth = useMemo(() => {
    return width / 30;
  }, [width]);

  return (
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
  );
};

const CHART_BAR_SEPARATOR = 2;
const NB_DATE_DISPLAYED = 6;

export type StatsData = {
  contactCardScans: number;
  webCardViews: number;
  shareBacks: number;
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
  },
  dark: {
    textDate: {
      color: colors.white,
    },
  },
  light: {
    textDate: {
      color: colors.black,
    },
  },
}));

/**
 * A function to normalize an array of numbers, transforming them into a range between 0 and 1
 * @param values The array of numbers to normalize
 * @returns The normalized array
 */
export const normalizeArray = (values: number[]) => {
  'worklet';
  const maxValue = Math.max(...values);
  return values.map(value => value / maxValue);
};
