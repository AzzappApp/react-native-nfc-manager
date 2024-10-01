import { memo, useCallback, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import PressableScaleHighlight from '#ui/PressableScaleHighlight';
import Text from '#ui/Text';
import { calculateBoxSize } from './CoverEditor/coverEditorHelpers';
import type {
  LayoutChangeEvent,
  ListRenderItemInfo,
  ViewProps,
  ViewStyle,
} from 'react-native';

export type BoxButtonItemInfo<T> = {
  item: T | null;
  index: number;
  width: number;
  height: number;
};

export type BoxSelectionListProps<T> = Omit<ViewProps, 'hitSlop'> & {
  data: readonly T[];
  selectedItem: T | null;
  imageRatio?: number;
  renderItem: (params: BoxButtonItemInfo<T>) => React.ReactNode;
  renderLabel?: (params: BoxButtonItemInfo<T>) => React.ReactNode;
  keyExtractor: (item: T | null, index: number) => string;
  onSelect: (item: T | null) => void;
  onItemHeightChange?: (height: number) => void;
  fixedItemWidth?: number;
};

const BoxSelectionList = <T,>({
  data,
  selectedItem,
  imageRatio = COVER_RATIO,
  renderItem,
  renderLabel,
  keyExtractor,
  onSelect,
  onLayout,
  onItemHeightChange,
  fixedItemWidth,
  ...props
}: BoxSelectionListProps<T>) => {
  const styles = useStyleSheet(styleSheet);

  const [height, setHeight] = useState<number | null>(null);

  const onLayoutInner = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;
      setHeight(height);
      onLayout?.(event);
      onItemHeightChange?.(height - VERTICAL_PADDING * 2);
    },
    [onItemHeightChange, onLayout],
  );

  const renderButton = useCallback(
    ({ item, index }: ListRenderItemInfo<T | null>) => {
      if (height === null) {
        return null;
      }
      return (
        <BoxButtonMemo
          item={item}
          index={index}
          renderItem={renderItem}
          renderLabel={renderLabel}
          imageRatio={imageRatio}
          // eslint-disable-next-line eqeqeq
          isSelected={selectedItem == item}
          height={height - VERTICAL_PADDING * 2}
          onSelect={onSelect}
          fixedItemWidth={fixedItemWidth}
          {...props}
        />
      );
    },
    [
      height,
      renderItem,
      renderLabel,
      imageRatio,
      selectedItem,
      onSelect,
      fixedItemWidth,
      props,
    ],
  );

  const innerKeyExtractor = useCallback(
    (item: T | null, index: number) =>
      item ? keyExtractor(item, index) : `first-item`,
    [keyExtractor],
  );

  const innerData = useMemo(
    () => (height === null ? [] : [null, ...data]),
    [data, height],
  );

  // We need a itemLayout to be able to preselect the initial item
  // this component try to be used in different case and far to complexe. one case of handle aspectRatio and other case of fixed width
  // it should have been stay separated, in addition the callback  onItemHeightChange can change the width and adding more complexity to the calcul
  // including some magic number to make if fit
  const getItemLayout = useCallback(
    (_: any, index: number) => {
      if (fixedItemWidth) {
        return {
          length: fixedItemWidth,
          offset: fixedItemWidth * index,
          index,
        };
      }

      const { width } = calculateBoxSize({
        height: height ? height - VERTICAL_PADDING * 2 : 0,
        hasLabel: !!renderLabel,
        ratio: imageRatio,
        fixedItemWidth,
      });

      return {
        length: width,
        offset: width * index + HORIZONTAL_PADDING,
        index,
      };
    },
    [fixedItemWidth, height, imageRatio, renderLabel],
  );

  const initialScrollIndex = useMemo(() => {
    if (innerData.length === 0 || !selectedItem) return 0;

    return innerData.indexOf(selectedItem);
  }, [innerData, selectedItem]);

  return (
    <FlatList
      {...props}
      data={innerData}
      renderItem={renderButton}
      keyExtractor={innerKeyExtractor}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContentContainer}
      onLayout={onLayoutInner}
      getItemLayout={getItemLayout}
      initialScrollIndex={initialScrollIndex}
    />
  );
};

export default BoxSelectionList;

type BoxButtonProps<T> = {
  item: T | null;
  index: number;
  renderLabel?: (params: BoxButtonItemInfo<T>) => React.ReactNode;
  renderItem: (params: BoxButtonItemInfo<T>) => React.ReactNode;
  isSelected: boolean;
  height: number;
  imageRatio: number;
  onSelect: (item: T | null) => void;
  fixedItemWidth?: number;
};

const BoxButton = <T,>({
  item,
  index,
  isSelected,
  height,
  renderLabel,
  imageRatio,
  onSelect,
  renderItem,
  fixedItemWidth,
}: BoxButtonProps<T>) => {
  const onPress = useCallback(() => {
    onSelect(item);
  }, [onSelect, item]);

  const { itemHeight, itemWidth, width } = calculateBoxSize({
    height,
    hasLabel: !!renderLabel,
    ratio: imageRatio,
    fixedItemWidth,
  });

  const borderRadius = itemWidth * COVER_CARD_RADIUS;

  const itemInfos = { item, index, width: itemWidth, height: itemHeight };

  const styles = useStyleSheet(styleSheet);

  return (
    <View style={{ height, width }}>
      <PressableScaleHighlight
        style={[
          styles.button,
          {
            width: itemWidth,
            height: itemHeight,
            borderRadius,
            top: 6,
            left: (width - itemWidth) / 2,
          },
        ]}
        onPress={onPress}
        accessibilityRole="button"
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <View
          style={{
            width: itemWidth,
            height: itemHeight,
            borderRadius,
            overflow: 'hidden',
            borderCurve: 'continuous',
          }}
        >
          {renderItem(itemInfos)}
        </View>
      </PressableScaleHighlight>
      {isSelected && (
        <>
          <View
            style={[
              styles.buttonOuterBorder,
              {
                height: itemHeight + 12,
                width: itemWidth + 12,
                borderRadius: borderRadius + 6,
                left: (width - itemWidth) / 2 - 6,
              },
            ]}
            pointerEvents="none"
          />
          <View
            style={[
              styles.buttonInnerBorder,
              {
                height: itemHeight + 4,
                width: itemWidth + 4,
                borderRadius: borderRadius + 2,
                left: (width - itemWidth) / 2 - 2,
              },
            ]}
            pointerEvents="none"
          />
        </>
      )}
      {renderLabel && (
        <Text variant="small" style={styles.label}>
          {renderLabel(itemInfos)}
        </Text>
      )}
    </View>
  );
};

const BoxButtonMemo: <T>(props: BoxButtonProps<T>) => React.ReactNode = memo(
  BoxButton,
) as any;

const VERTICAL_PADDING = 15;
const HORIZONTAL_PADDING = 20;

const styleSheet = createStyleSheet(appearance => ({
  listContentContainer: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: VERTICAL_PADDING,
  },
  button: [
    {
      position: 'absolute',
      top: 6,
      left: 6,
      backgroundColor: appearance === 'dark' ? colors.grey900 : colors.grey200,
      borderCurve: 'continuous',
    },
    Platform.select<ViewStyle>({
      default: {
        overflow: 'visible',
        ...shadow(appearance),
      },
      android: {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: appearance === 'dark' ? colors.grey800 : colors.grey100,
        overflow: 'hidden',
        elevation: 0,
      },
    }),
  ],
  buttonInnerBorder: {
    position: 'absolute',
    top: 4,
    left: 4,
    borderWidth: 2,
    borderColor: appearance === 'dark' ? colors.black : colors.white,
    borderCurve: 'continuous',
  },
  buttonOuterBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderWidth: 4,
    borderColor: appearance === 'dark' ? colors.white : colors.black,
    borderCurve: 'continuous',
  },
  label: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    textAlign: 'center',
  },
}));
