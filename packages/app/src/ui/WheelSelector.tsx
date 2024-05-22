import { LinearGradient } from 'expo-linear-gradient';
import range from 'lodash/range';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, View, useColorScheme } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { trigger } from 'react-native-haptic-feedback';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';

export type WheelSelectorProps = {
  variant?: 'default' | 'small';
  value: number;
  min: number;
  max: number;
  step: number;
  label?: string;
  interval?: number;
  onChange?: (value: number) => void;
  withHaptics?: boolean;
};
const windowWidth = Dimensions.get('window').width;
const defaultInterval = Math.floor((windowWidth - 80) / 60);

const WheelSelector = ({
  variant = 'default',
  min,
  max,
  step,
  value,
  onChange,
  interval,
  withHaptics = true,
}: WheelSelectorProps) => {
  const factor = variant === 'small' ? 0.5 : 1;
  const itemWidth = (interval ? interval : defaultInterval) * factor;
  const styles = useStyleSheet(styleSheet);
  const steps = range(min, max + 1, step);
  const size = steps.length * itemWidth;
  const colorScheme = useColorScheme();
  const colorsGradient = useMemo(
    () =>
      colorScheme === 'light'
        ? ['rgba(245, 245, 246, 0)', colors.grey50, 'rgba(245, 245, 246, 0)']
        : ['rgba(0, 0, 0, 0)', '#1E1E1E', 'rgba(0, 0, 0, 0)'],
    [colorScheme],
  );

  const renderItem = useCallback(() => {
    return (
      <View
        style={{
          width: itemWidth,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View style={styles.dash} />
      </View>
    );
  }, [itemWidth, styles.dash]);

  const [layoutWidth, setLayoutWidth] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setLayoutWidth(event.nativeEvent.layout.width);
  }, []);

  const containerStyle = useMemo(() => {
    // Calculate the padding needed to center the first and last items
    const horizontalPadding = (layoutWidth * factor - itemWidth) / 2;
    return [
      {
        paddingLeft: horizontalPadding,
        paddingRight: horizontalPadding,
        height: WHEEL_HEIGHT,
        flexGrow: 1,
        width: size - itemWidth + layoutWidth * factor,
      },
    ];
  }, [factor, itemWidth, layoutWidth, size]);

  // Step 1: Create a ref to store the last index
  const lastIndexRef = useRef<number>(-1);
  //Should I use reanimated and sharedValue
  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollPosition = event.nativeEvent.contentOffset.x;
      const index = Math.round(scrollPosition / itemWidth);

      if (lastIndexRef.current !== index) {
        if (withHaptics) {
          trigger('impactLight');
        }
        lastIndexRef.current = index; // Update the ref with the current index
        onChange?.(steps[index]);
      }
    },
    [itemWidth, onChange, steps, withHaptics],
  );

  const flatListRef = useRef<FlatList>(null);
  useEffect(() => {
    if (flatListRef.current != null) {
      flatListRef.current?.scrollToIndex({
        index: value - min,
        animated: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flatListRef?.current]);

  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: itemWidth,
      offset: itemWidth * index,
      index,
    }),
    [itemWidth],
  );
  return (
    <View
      style={{
        width: '100%',
        height: WHEEL_HEIGHT,
        alignItems: 'center',
      }}
      onLayout={onLayout}
    >
      {layoutWidth > 0 && (
        <View
          style={{
            width: layoutWidth * factor,
            flex: 1,
          }}
        >
          <MemoizedLinearGradient
            colors={colorsGradient}
            locations={gradientLocation}
            start={gradientStart}
            end={gradientEnd}
            style={{
              height: WHEEL_HEIGHT,
              width: '100%',
              pointerEvents: 'box-none',
            }}
          >
            <FlatList
              ref={flatListRef}
              data={steps}
              keyExtractor={keyExtractor}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={itemWidth}
              bounces={false}
              decelerationRate="fast"
              scrollEventThrottle={16}
              snapToAlignment="start"
              contentContainerStyle={containerStyle}
              renderItem={renderItem}
              onScroll={onScroll}
              onMomentumScrollEnd={onScroll}
              getItemLayout={getItemLayout}
            />
          </MemoizedLinearGradient>
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: (layoutWidth * factor - 2) / 2, // Assuming the indicator is 2px wide
              right: (layoutWidth * factor - 2) / 2,
              height: 20,
              width: 6,
              borderRadius: 3,
              backgroundColor: colors.black,
            }}
          />
        </View>
      )}
    </View>
  );
};

const keyExtractor = (item: number) => item.toString();

export default WheelSelector;
const WHEEL_HEIGHT = 20;
const gradientLocation = [0.0, 0.5, 1];
const gradientStart = { x: 0, y: 1 };
const gradientEnd = { x: 1, y: 1 };

const MemoizedLinearGradient = memo(
  LinearGradient,
  (prevProps, nextProps) =>
    prevProps.colors === nextProps.colors &&
    prevProps.locations === nextProps.locations &&
    prevProps.start === nextProps.start &&
    prevProps.end === nextProps.end,
);

const styleSheet = createStyleSheet(appearance => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 23,
    overflow: 'hidden',
    width: '100%',
  },
  dashContainer: {},
  dash: {
    height: 12,
    width: 1,
    borderRadius: 3,
    backgroundColor: appearance === 'light' ? colors.grey200 : colors.grey800,
  },
  thumb: {
    height: 20,
    width: 6,
    borderRadius: 3,
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
  },
}));
