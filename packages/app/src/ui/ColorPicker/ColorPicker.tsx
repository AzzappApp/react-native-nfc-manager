import chroma from 'chroma-js';
import { memo, useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { View, Pressable, StyleSheet } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { colors } from '#theme';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
import Icon from '#ui/Icon/Icon';
import PressableNative from '#ui/PressableNative';
import ViewTransition from '#ui/ViewTransition/ViewTransition';
import ColorChooser from './ColorChooser';

import type { LayoutChangeEvent, ViewProps } from 'react-native';

export type ColorPickerProps = {
  height?: number;
  selectedColor: string;
  colorList: readonly string[] | null;
  onChangeColor: (color: string) => void;
  addColor: (color: string) => void;
  deleteColor: (color: string) => void;
  style?: ViewProps['style'] | undefined;
  setEditMode?: (editMode: boolean) => void;
};

const ITEM_PER_ROW = 5;

const ColorPicker = ({
  colorList = [],
  selectedColor,
  height = 330,
  onChangeColor,
  addColor,
  deleteColor,
  style,
  setEditMode,
}: ColorPickerProps) => {
  const intl = useIntl();
  const [localColor, setLocalColor] = useState(selectedColor);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const onSelectColor = useCallback(
    (color: string) => {
      setLocalColor(color);
      onChangeColor(color);
    },
    [onChangeColor],
  );

  const [itemWidth, setItemWidth] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    // calculate the average width of the items for perfect fitting
    const { width } = event.nativeEvent.layout;
    setItemWidth(Math.floor(width / ITEM_PER_ROW));
  }, []);

  const [editPalette, setEditPalette] = useState(false);

  const toggleEditPalette = useCallback(() => {
    if (setEditMode) {
      setEditMode(!editPalette);
    }
    setEditPalette(!editPalette);
  }, [editPalette, setEditMode]);

  const renderItem = useCallback(
    ({ item }: { item: string }) => {
      if (item === 'add') {
        return (
          <PressableNative
            onPress={() => {
              setColorPickerOpen(true);
            }}
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
              <Icon icon="plus" style={styles.iconPlus} />
            </View>
          </PressableNative>
        );
      }
      return (
        <ColorPickerItemMemo
          color={item}
          selected={localColor === item}
          selectColor={onSelectColor}
          deleteColor={deleteColor}
          editMode={editPalette}
          itemWidth={itemWidth}
        />
      );
    },
    [localColor, onSelectColor, deleteColor, editPalette, itemWidth],
  );

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      <FlatList
        numColumns={ITEM_PER_ROW}
        data={['add', ...(colorList ?? [])]}
        renderItem={renderItem}
        bounces={false}
        style={{ marginBottom: 4 }}
      />

      <View
        style={[
          styles.centerAlign,
          {
            flexDirection: 'row',
          },
        ]}
      >
        <Button
          label={intl.formatMessage({
            defaultMessage: 'Edit Palette',
            description: 'ColorPicker component button Edit Palette',
          })}
          onPress={toggleEditPalette}
          variant={editPalette ? 'primary' : 'secondary'}
          style={styles.removeColorButton}
        />
      </View>
      <BottomSheetModal
        visible={colorPickerOpen}
        onValidate={() => {
          addColor(localColor);
          setColorPickerOpen(false);
        }}
        onCancel={() => setColorPickerOpen(false)}
        title={intl.formatMessage({
          defaultMessage: 'Add a color',
          description: 'ColorPicker component - Bottom sheet title Add a color',
        })}
        height={height}
        cancelLabel={'add'}
        validationButtonLabel={intl.formatMessage({
          defaultMessage: 'Add',
          description:
            'ColorPicker component - Bottom sheet label button validate action',
        })}
      >
        <ColorChooser value={localColor} onChangeColor={onSelectColor} />
      </BottomSheetModal>
    </View>
  );
};

//We can improve later with rowgap and column gap
type ColorPickerItemProps = {
  color: string;
  selected: boolean;
  selectColor: (color: string) => void;
  deleteColor: (color: string) => void;
  editMode: boolean;
  itemWidth: number;
};
const ColorPickerItem = ({
  color,
  selected,
  selectColor,
  deleteColor,
  editMode,
  itemWidth,
}: ColorPickerItemProps) => {
  const onPressColor = useCallback(() => {
    if (editMode) {
      deleteColor(color);
    } else {
      selectColor(color);
    }
  }, [editMode, deleteColor, color, selectColor]);

  const ITEM_CALCUL = itemWidth - ITEM_MARGIN;

  const closeColor = chroma(color).darken(0.8).hex();
  return (
    <ViewTransition
      pointerEvents="box-none"
      style={[
        styles.itemContainer,
        {
          width: ITEM_CALCUL,
          height: ITEM_CALCUL,
          borderRadius: itemWidth / 2,
          borderColor: `rgba(0,0,0,${selected ? 1 : 0})`,
        },
      ]}
      transitions={['borderColor']}
      transitionDuration={280}
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
        <ViewTransition
          style={{
            width: ITEM_CALCUL - 19,
            height: ITEM_CALCUL - 19,
            borderRadius: (ITEM_CALCUL - 9) / 2,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: editMode ? 'rgba(255, 255, 255, 0.5)' : color, //don't use transparent, it will cause a small blinking
            opacity: editMode ? 1 : 0,
          }}
          transitions={['backgroundColor', 'opacity']}
          transitionDuration={300}
        >
          <Icon
            icon="cross"
            style={{
              height: 14,
              width: 14,
              tintColor: colors.black,
            }}
          />
        </ViewTransition>
      </Pressable>
    </ViewTransition>
  );
};

// recommended to memo/pure component flastlist item
const ColorPickerItemMemo = memo(ColorPickerItem);
const ITEM_MARGIN = 10;

const BORDER_WIDTH = 2;

export default ColorPicker;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-start' },
  centerAlign: { justifyContent: 'center', alignItems: 'center' },
  iconPlus: { height: 17, width: 17, tintColor: colors.grey200 },
  itemContainer: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: ITEM_MARGIN / 2,
    marginRight: ITEM_MARGIN / 2,
    marginTop: 5,
  },
  removeColorButton: {
    flex: 1,
  },
});
