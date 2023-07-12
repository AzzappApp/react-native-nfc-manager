import chroma from 'chroma-js';
import { memo, useCallback, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { colors } from '#theme';
import useAnimatedState from '#hooks/useAnimatedState';
import Icon from '#ui/Icon/Icon';
import PressableNative from '#ui/PressableNative';

import type { LayoutChangeEvent, ViewProps } from 'react-native';

export type ColorPaletteProps = {
  selectedColor: string;
  colorList: readonly string[];
  editMode?: boolean;
  onSelectColor: (color: string) => void;
  onRemoveColor: (color: string) => void;
  onRequestNewColor: () => void;
  style?: ViewProps['style'] | undefined;
};

const ITEM_PER_ROW = 5;

const ColorPalette = ({
  selectedColor,
  colorList,
  editMode,
  onSelectColor,
  onRemoveColor,
  onRequestNewColor,
  style,
}: ColorPaletteProps) => {
  const [itemWidth, setItemWidth] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    // calculate the average width of the items for perfect fitting
    const { width } = event.nativeEvent.layout;
    setItemWidth(Math.floor(width / ITEM_PER_ROW));
  }, []);

  return (
    <ScrollView
      bounces={false}
      style={[styles.container, style]}
      contentContainerStyle={{
        flexWrap: 'wrap',
        flexDirection: 'row',
      }}
      onLayout={onLayout}
    >
      <PressableNative
        onPress={onRequestNewColor}
        style={[
          styles.itemContainer,
          {
            width: itemWidth - ITEM_MARGIN,
            height: itemWidth - ITEM_MARGIN,
            borderRadius: itemWidth / 2,
            borderColor: `rgba(0,0,0,0)`,
          },
        ]}
      >
        <View
          style={[
            styles.centerAlign,
            {
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: colors.grey200,
              width: itemWidth - ITEM_MARGIN - 10,
              height: itemWidth - ITEM_MARGIN - 10,
              borderRadius: (itemWidth - ITEM_MARGIN - 10) / 2,
            },
          ]}
        >
          <Icon icon="add" />
        </View>
      </PressableNative>
      {colorList.map(color => (
        <ColorPickerItemMemo
          key={color}
          color={color}
          selected={selectedColor === color}
          onSelectColor={onSelectColor}
          onRemoveColor={onRemoveColor}
          editMode={!!editMode}
          itemWidth={itemWidth}
        />
      ))}
    </ScrollView>
  );
};

//We can improve later with rowgap and column gap
type ColorPaletteItemProps = {
  color: string;
  selected: boolean;
  onSelectColor: (color: string) => void;
  onRemoveColor: (color: string) => void;
  editMode: boolean;
  itemWidth: number;
};

const ColorPaletteItem = ({
  color,
  selected,
  onSelectColor,
  onRemoveColor,
  editMode,
  itemWidth,
}: ColorPaletteItemProps) => {
  const onPressColor = useCallback(() => {
    if (editMode) {
      onRemoveColor(color);
    } else {
      onSelectColor(color);
    }
  }, [editMode, onRemoveColor, color, onSelectColor]);

  const ITEM_CALCUL = itemWidth - ITEM_MARGIN;
  const colorScheme = useColorScheme();
  const closeColor = chroma(color).darken(0.8).hex();

  const opacity = useAnimatedState(selected, { duration: 280 });
  const viewBorderStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      opacity.value,
      [0, 1],
      [
        colorScheme === 'light' ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0)',
        colorScheme === 'light' ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)',
      ],
    );
    return {
      borderColor: color,
    };
  }, [opacity]);

  const edit = useAnimatedState(editMode, { duration: 300 });
  const iconStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        edit.value,
        [0, 1],
        [color, 'rgba(255, 255, 255, 0.5)'],
      ),
      opacity: edit.value,
    };
  }, [opacity]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.itemContainer,
        {
          width: ITEM_CALCUL,
          height: ITEM_CALCUL,
          borderRadius: itemWidth / 2,
        },
        viewBorderStyle,
      ]}
    >
      <Pressable
        onPress={onPressColor}
        style={{
          width: ITEM_CALCUL - ITEM_MARGIN,
          height: ITEM_CALCUL - ITEM_MARGIN,
          backgroundColor: color,
          borderColor: closeColor,
          borderRadius: (itemWidth - 2 * BORDER_WIDTH - ITEM_MARGIN) / 2,
          borderWidth: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Animated.View
          style={[
            styles.iconContainer,
            {
              width: ITEM_CALCUL - 19,
              height: ITEM_CALCUL - 19,
              borderRadius: (ITEM_CALCUL - 9) / 2,
            },
            iconStyle,
          ]}
        >
          <Icon icon="close" />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

// recommended to memo/pure component list item
const ColorPickerItemMemo = memo(ColorPaletteItem);

export default ColorPalette;

const ITEM_MARGIN = 10;
const BORDER_WIDTH = 2;

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: { flex: 1 },
  centerAlign: { justifyContent: 'center', alignItems: 'center' },

  itemContainer: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: ITEM_MARGIN / 2,
    marginRight: ITEM_MARGIN / 2,
    marginTop: 5,
  },
  buttonBarButton: {
    flex: 1,
  },
  buttonBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
