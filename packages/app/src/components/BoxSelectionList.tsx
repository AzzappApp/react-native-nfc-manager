import { memo, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type {
  LayoutChangeEvent,
  ListRenderItemInfo,
  ViewProps,
} from 'react-native';

export type BoxButtonItemInfo<T> = {
  item: T | null;
  index: number;
  width: number;
  height: number;
};

export type BoxSelectionListProps<T> = ViewProps & {
  data: readonly T[];
  selectedItem: T | null;
  imageRatio?: number;
  renderItem: (params: BoxButtonItemInfo<T>) => React.ReactNode;
  renderLabel?: (params: BoxButtonItemInfo<T>) => React.ReactNode;
  keyExtractor: (item: T) => string;
  onSelect: (item: T | null) => void;
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
  ...props
}: BoxSelectionListProps<T>) => {
  const styles = useStyleSheet(styleSheet);

  const [height, setHeight] = useState<number | null>(null);

  const onLayoutInner = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;
      setHeight(height);
      onLayout?.(event);
    },
    [onLayout],
  );

  const renderbutton = useCallback(
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
      props,
    ],
  );

  const innerKeyExtractor = useCallback(
    (item: T | null) => (item ? keyExtractor(item) : `first-item`),
    [keyExtractor],
  );

  const innerData = useMemo(
    () => (height === null ? [] : [null, ...data]),
    [data, height],
  );

  return (
    <FlatList
      {...props}
      data={innerData}
      renderItem={renderbutton}
      keyExtractor={innerKeyExtractor}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContentContainer}
      onLayout={onLayoutInner}
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
}: BoxButtonProps<T>) => {
  const onPress = useCallback(() => {
    onSelect(item);
  }, [onSelect, item]);

  const itemHeight = height - 12 - (renderLabel ? 25 : 0);
  const itemWidth = itemHeight * imageRatio;
  const width = itemWidth + 12;
  const borderRadius = itemWidth * COVER_CARD_RADIUS;

  const itemInfos = { item, index, width: itemWidth, height: itemHeight };

  const styles = useStyleSheet(styleSheet);

  return (
    <View style={{ height, width }}>
      <PressableNative
        style={[
          styles.button,
          {
            width: itemWidth,
            height: itemHeight,
            borderRadius,
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
      </PressableNative>
      {isSelected && (
        <>
          <View
            style={[
              styles.buttonOuterBorder,
              {
                height: itemHeight + 12,
                width: itemWidth + 12,
                borderRadius: borderRadius + 6,
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

const styleSheet = createStyleSheet(appearance => ({
  listContentContainer: {
    paddingHorizontal: 20,
    paddingVertical: VERTICAL_PADDING,
  },
  button: [
    {
      position: 'absolute',
      top: 6,
      left: 6,
      overflow: 'visible',
      backgroundColor: appearance === 'dark' ? colors.grey900 : colors.grey200,
      borderCurve: 'continuous',
    },
    shadow(appearance),
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
