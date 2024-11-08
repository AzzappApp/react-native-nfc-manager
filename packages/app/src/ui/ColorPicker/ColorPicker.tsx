import uniq from 'lodash/uniq';
import { useCallback, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useWindowDimensions, View, StyleSheet } from 'react-native';
import { swapColor, type ColorPalette } from '@azzapp/shared/cardHelpers';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
import Header from '#ui/Header';
import ColorChooser from './ColorChooser';
import ColorList from './ColorsList';

export type ColorPickerProps = {
  /**
   * whether the bottomsheet is visible or not
   */
  visible: boolean;
  /**
   * The title of the bottomsheet
   */
  title: string;
  /**
   * The height of the bottomsheet @default 200
   */
  height?: number;
  /**
   * The selected color
   */
  selectedColor: string;
  /**
   * The color palette of the user
   */
  colorPalette: ColorPalette;
  /**
   * The other colors of the user
   */
  colorList: readonly string[] | null;
  /**
   * Whether the user can edit the palette or not
   */
  canEditPalette?: boolean;
  /**
   * Called when the user select a color
   */
  onColorChange: (color: string) => void;

  /**
   * Called when the user update the color palette
   */
  onUpdateColorPalette: (colorPalette: ColorPalette) => void;
  /**
   * Called when the user update the color list
   */
  onUpdateColorList: (color: string[]) => void;

  /**
   * Called when the user close the bottomsheet
   */
  onRequestClose: () => void;
};

const ColorPicker = ({
  visible,
  height,
  title,
  selectedColor,
  colorPalette,
  colorList,
  canEditPalette = false,
  onRequestClose,
  onColorChange,
  onUpdateColorPalette,
  onUpdateColorList,
}: ColorPickerProps) => {
  const [state, setState] = useState<
    'colorChooser' | 'colorEdition' | 'editing'
  >('colorChooser');
  const onClose = useCallback(() => {
    if (state === 'colorChooser') {
      onRequestClose();
      return;
    }
    // TODO blink edition button to show that the user can't close the modal
  }, [onRequestClose, state]);

  const previouslySelectedColor = useRef<string | null>(selectedColor);
  const selectedColorValue = swapColor(selectedColor, colorPalette);

  const onValidateColor = useCallback(() => {
    previouslySelectedColor.current = selectedColor;
    onRequestClose();
  }, [onRequestClose, selectedColor]);

  const onEdit = useCallback(() => {
    setState('editing');
  }, []);

  const onCancelEdit = useCallback(() => {
    setColorsToRemove(new Set());
    setState('colorChooser');
  }, []);

  const onRequestNewColor = () => {
    previouslySelectedColor.current = selectedColor;
    setState('colorEdition');
  };

  const editedColorPaletteProperty = useRef<
    'dark' | 'light' | 'primary' | null
  >(null);
  const onEditPaletteColor = useCallback(
    (color: 'dark' | 'light' | 'primary') => {
      previouslySelectedColor.current = selectedColor;
      editedColorPaletteProperty.current = color;
      onColorChange(color);
      setState('colorEdition');
    },
    [onColorChange, selectedColor],
  );

  const onCancelColorEdition = useCallback(() => {
    const previousColor = previouslySelectedColor.current ?? selectedColor;
    onColorChange(previousColor);
    editedColorPaletteProperty.current = null;
    previouslySelectedColor.current = null;
    setState('colorChooser');
  }, [onColorChange, selectedColor]);

  const onSaveEditedColor = useCallback(() => {
    previouslySelectedColor.current = null;
    if (editedColorPaletteProperty.current) {
      const colorName = editedColorPaletteProperty.current;
      onUpdateColorPalette({
        ...colorPalette,
        [colorName]: selectedColorValue,
      });
      editedColorPaletteProperty.current = null;
      onColorChange(colorName);
    } else {
      setColorsToRemove(colorsToRemove => {
        const newColorsToRemove = new Set(colorsToRemove);
        newColorsToRemove.delete(selectedColorValue);
        return newColorsToRemove;
      });

      onUpdateColorList(
        uniq(
          colorList ? [...colorList, selectedColorValue] : [selectedColorValue],
        ),
      );
    }
    setState('colorChooser');
  }, [
    colorList,
    colorPalette,
    onColorChange,
    onUpdateColorList,
    onUpdateColorPalette,
    selectedColorValue,
  ]);

  const [colorsToRemove, setColorsToRemove] = useState(new Set<string>());
  const onRemoveColor = useCallback(
    (color: string) => {
      setColorsToRemove(colorsToRemove => {
        const newColorsToRemove = new Set(colorsToRemove);
        newColorsToRemove.add(color);
        return newColorsToRemove;
      });

      if (selectedColor === color) {
        onColorChange(colorPalette.primary);
      }
    },
    [colorPalette.primary, onColorChange, selectedColor],
  );

  const onSaveEditedColorList = useCallback(() => {
    onUpdateColorList((colorList ?? []).filter(c => !colorsToRemove.has(c)));
    setColorsToRemove(new Set());
    setState('colorChooser');
  }, [colorList, colorsToRemove, onUpdateColorList]);

  const intl = useIntl();

  const { width: windowWidth } = useWindowDimensions();

  return (
    <BottomSheetModal
      visible={visible}
      enableContentPanningGesture={
        state !== 'colorChooser' && state !== 'editing'
      }
      onDismiss={onClose}
      height={height}
      automaticBottomPadding={false}
      showHandleIndicator={false}
      dismissKeyboardOnOpening
    >
      <View style={styles.bottomContainerView}>
        <Header
          middleElement={
            state === 'colorChooser'
              ? title
              : state === 'editing'
                ? intl.formatMessage({
                    defaultMessage: 'Edit Palette',
                    description: 'ColorPicker component button Edit Palette',
                  })
                : intl.formatMessage({
                    defaultMessage: 'Add a color',
                    description:
                      'ColorPicker component title when adding a color',
                  })
          }
          leftElement={
            <Button
              label={
                state === 'colorChooser'
                  ? intl.formatMessage({
                      defaultMessage: 'Edit',
                      description: 'ColorPicker component Edit button label',
                    })
                  : intl.formatMessage({
                      defaultMessage: 'Cancel',
                      description: 'ColorPicker component Cancel button label',
                    })
              }
              onPress={
                state === 'colorChooser'
                  ? onEdit
                  : state === 'colorEdition'
                    ? onCancelColorEdition
                    : onCancelEdit
              }
              variant="secondary"
            />
          }
          rightElement={
            <Button
              label={
                state === 'colorChooser'
                  ? intl.formatMessage({
                      defaultMessage: 'Done',
                      description: 'ColorPicker component Done button label',
                    })
                  : intl.formatMessage({
                      defaultMessage: 'Done',
                      description:
                        'ColorPicker component Done Color button label',
                    })
              }
              onPress={
                state === 'colorChooser'
                  ? onValidateColor
                  : state === 'colorEdition'
                    ? onSaveEditedColor
                    : onSaveEditedColorList
              }
              variant="primary"
            />
          }
          style={styles.bottomHeader}
        />
        {state !== 'colorEdition' ? (
          <ColorList
            selectedColor={selectedColor}
            colorList={colorList?.filter(c => !colorsToRemove.has(c)) ?? []}
            onSelectColor={onColorChange}
            editMode={state === 'editing'}
            canEditPalette={canEditPalette}
            colorPalette={colorPalette}
            onRequestNewColor={onRequestNewColor}
            onRemoveColor={onRemoveColor}
            onEditColor={onEditPaletteColor}
            width={windowWidth - 40}
          />
        ) : (
          <ColorChooser
            value={selectedColorValue}
            onColorChange={onColorChange}
          />
        )}
      </View>
    </BottomSheetModal>
  );
};

export default ColorPicker;

const styles = StyleSheet.create({
  bottomHeader: { marginBottom: 16, paddingLeft: 0, paddingRight: 0 },
  bottomContainerView: {
    paddingHorizontal: 14,
    flex: 1,
  },
});
