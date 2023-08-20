import { uniq } from 'lodash';
import { useCallback, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
import ColorChooser from './ColorChooser';
import ColorList from './ColorsList';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';

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
      setState('colorEdition');
    },
    [selectedColor],
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
      onUpdateColorPalette({
        ...colorPalette,
        [editedColorPaletteProperty.current]: selectedColor,
      });
      editedColorPaletteProperty.current = null;
    } else {
      onUpdateColorList(
        uniq(colorList ? [...colorList, selectedColor] : [selectedColor]),
      );
    }
    setState('colorChooser');
  }, [
    colorList,
    colorPalette,
    onUpdateColorList,
    onUpdateColorPalette,
    selectedColor,
  ]);

  const [colorsToRemove, setColorsToRemove] = useState(new Set<string>());
  const onRemoveColor = useCallback((color: string) => {
    setColorsToRemove(colorsToRemove => {
      const newColorsToRemove = new Set(colorsToRemove);
      newColorsToRemove.add(color);
      return newColorsToRemove;
    });
  }, []);

  const onSaveEditedColorList = useCallback(() => {
    onUpdateColorList((colorList ?? []).filter(c => !colorsToRemove.has(c)));
    setColorsToRemove(new Set());
    setState('colorChooser');
  }, [colorList, colorsToRemove, onUpdateColorList]);

  const intl = useIntl();
  const { bottom } = useSafeAreaInsets();

  const { width: windowWidth } = useWindowDimensions();

  return (
    <BottomSheetModal
      height={height}
      visible={visible}
      headerTitle={
        state === 'colorChooser'
          ? title
          : state === 'editing'
          ? intl.formatMessage({
              defaultMessage: 'Edit Palette',
              description: 'ColorPicker component button Edit Palette',
            })
          : intl.formatMessage({
              defaultMessage: 'Add a color',
              description: 'ColorPicker component title when adding a color',
            })
      }
      headerLeftButton={
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
      headerRightButton={
        <Button
          label={
            state === 'colorChooser'
              ? intl.formatMessage({
                  defaultMessage: 'Done',
                  description: 'ColorPicker component Done button label',
                })
              : intl.formatMessage({
                  defaultMessage: 'Done',
                  description: 'ColorPicker component Done Color button label',
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
      disableGestureInteraction={state !== 'colorChooser'}
      showGestureIndicator={false}
      onRequestClose={onClose}
    >
      {state !== 'colorEdition' ? (
        <ColorList
          selectedColor={selectedColor}
          colorList={colorList?.filter(c => !colorsToRemove.has(c)) ?? []}
          onSelectColor={onColorChange}
          editMode={state === 'editing'}
          canEditPalette={canEditPalette}
          colorPalette={colorPalette}
          style={{ marginBottom: bottom }}
          onRequestNewColor={onRequestNewColor}
          onRemoveColor={onRemoveColor}
          onEditColor={onEditPaletteColor}
          width={windowWidth - 40}
        />
      ) : (
        <ColorChooser value={selectedColor} onColorChange={onColorChange} />
      )}
    </BottomSheetModal>
  );
};

export default ColorPicker;
