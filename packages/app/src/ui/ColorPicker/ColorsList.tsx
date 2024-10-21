import chroma from 'chroma-js';
import { memo, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {
  COLOR_PALETTE_COLORS,
  type ColorPalette,
} from '@azzapp/shared/cardHelpers';
import { getTextColor } from '@azzapp/shared/colorsHelpers';
import { colors } from '#theme';
import useAnimatedState from '#hooks/useAnimatedState';
import Icon from '#ui/Icon/Icon';
import PressableNative from '#ui/PressableNative';

import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import type { ViewProps, ViewStyle } from 'react-native';

export type ColorListProps = {
  selectedColor: string;
  colorPalette: ColorPalette;
  colorList: readonly string[];
  editMode?: boolean;
  canEditPalette?: boolean;
  width: number;
  onSelectColor: (color: string) => void;
  onRemoveColor: (color: string) => void;
  onEditColor: (color: 'dark' | 'light' | 'primary') => void;
  onRequestNewColor: () => void;
  style?: ViewProps['style'] | undefined;
};

const ITEM_PER_ROW = 5;

const ColorList = ({
  selectedColor,
  colorPalette,
  colorList,
  editMode,
  canEditPalette,
  width,
  onSelectColor,
  onRemoveColor,
  onRequestNewColor,
  onEditColor,
  style,
}: ColorListProps) => {
  const itemWidth = (width - ITEM_MARGIN * (ITEM_PER_ROW - 1)) / ITEM_PER_ROW;

  return (
    <ScrollView
      bounces={false}
      style={[styles.root, style]}
      contentContainerStyle={styles.container}
    >
      <View style={styles.colorSection}>
        <Text variant="small">
          <FormattedMessage
            defaultMessage="My WebCard{azzappA} colors"
            description="Name of the color palette section in color choose"
            values={{
              azzappA: <Text variant="azzapp">a</Text>,
            }}
          />
        </Text>
        <View style={styles.colorsContainer}>
          {COLOR_PALETTE_COLORS.map(colorName => {
            const color = colorPalette[colorName];
            return (
              <ColorPickerItemMemo
                key={colorName}
                color={color}
                selected={selectedColor === colorName}
                onSelect={() => onSelectColor(colorName)}
                onEdit={() => onEditColor(colorName)}
                editMode={!!editMode && !!canEditPalette}
                itemWidth={itemWidth}
                linkedColor
                canEdit={canEditPalette}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.colorSection}>
        <Text variant="small">
          <FormattedMessage
            defaultMessage="Other colors"
            description="Name of the color palette section in color choose"
          />
        </Text>
        <View style={styles.colorsContainer}>
          <PressableNative
            onPress={onRequestNewColor}
            style={[
              styles.itemContainer,
              {
                width: itemWidth,
                height: itemWidth,
                borderRadius: itemWidth / 2,
                borderColor: `rgba(0,0,0,0)`,
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
          >
            <View
              style={[
                {
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: colors.grey200,
                  width: itemWidth,
                  height: itemWidth,
                  borderRadius: itemWidth / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
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
              onSelect={() => onSelectColor(color)}
              onRemove={() => onRemoveColor(color)}
              editMode={!!editMode}
              itemWidth={itemWidth}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

//We can improve later with rowgap and column gap
type ColorListItemProps = {
  color: string;
  selected: boolean;
  onSelect: () => void;
  onRemove?: (() => void) | null | undefined;
  onEdit?: (() => void) | null | undefined;
  editMode: boolean;
  linkedColor?: boolean;
  canEdit?: boolean;
  itemWidth: number;
};

const ColorListItem = ({
  color,
  selected,
  onSelect,
  onRemove,
  onEdit,
  editMode,
  linkedColor = false,
  canEdit = false,
  itemWidth,
}: ColorListItemProps) => {
  const onPressColor = useCallback(() => {
    if (editMode) {
      if (onRemove) {
        onRemove();
      } else if (onEdit) {
        onEdit();
      }
    } else {
      onSelect();
    }
  }, [editMode, onRemove, onEdit, onSelect]);

  const colorScheme = useColorScheme();
  const borderColor =
    colorScheme === 'light'
      ? chroma(color).darken(0.8).hex()
      : chroma(color).brighten(1.8).hex();

  const selectedSharedValue = useAnimatedState(selected, { duration: 120 });
  const selectionBorder = useAnimatedStyle(() => {
    return {
      borderColor: interpolateColor(
        selectedSharedValue.value,
        [0, 1],
        [
          'rgba(0,0,0,0)',
          colorScheme === 'light' ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)',
        ],
      ),
      borderWidth: selectedSharedValue.value * 3,
    };
  }, [selectedSharedValue]);

  const editSharedValue = useAnimatedState(editMode, { duration: 150 });
  const editIconContainerStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        editSharedValue.value,
        [0, 1],
        [color, 'rgba(255, 255, 255, 0.5)'],
      ),
      opacity: editSharedValue.value,
    };
  }, [selectedSharedValue]);

  const linkIconContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - editSharedValue.value,
    };
  }, [selectedSharedValue]);

  const layerStyle: ViewStyle = {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    left: 0,
    width: itemWidth,
    height: itemWidth,
    borderRadius: itemWidth / 2,
  };

  return (
    <PressableOpacity
      onPress={onPressColor}
      style={{
        width: itemWidth,
        height: itemWidth,
        borderRadius: itemWidth / 2,
        backgroundColor: color,
      }}
      pointerEvents="box-only"
    >
      {(!linkedColor || canEdit) && (
        <Animated.View style={[layerStyle, editIconContainerStyle]}>
          <Icon
            icon={linkedColor ? 'edit' : 'close'}
            style={{ tintColor: getTextColor(color) }}
          />
        </Animated.View>
      )}
      {linkedColor && (
        <Animated.View style={[layerStyle, linkIconContainerStyle]}>
          <Icon icon="link" style={{ tintColor: getTextColor(color) }} />
        </Animated.View>
      )}
      {/** border interfere with layout so we use this trick */}
      <View style={[layerStyle, { borderColor, borderWidth: 2 }]} />
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: itemWidth + 10,
            height: itemWidth + 10,
            left: -5,
            top: -5,
            borderRadius: (itemWidth + 10) / 2,
          },
          selectionBorder,
        ]}
      />
    </PressableOpacity>
  );
};

// recommended to memo/pure component list item
const ColorPickerItemMemo = memo(ColorListItem);

export default ColorList;

const ITEM_MARGIN = 10;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  container: {
    gap: 10,
    overflow: 'visible',
  },
  colorSection: {
    gap: 10,
  },
  colorsContainer: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    gap: ITEM_MARGIN,
    paddingLeft: 5,
    paddingBottom: 5,
  },
  itemContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
