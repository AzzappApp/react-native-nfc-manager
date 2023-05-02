import { useCallback, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
import ColorChooser from './ColorChooser';
import ColorPalette from './ColorPalette';

export type ColorPickerProps = {
  /**
   * whether the bottomsheet is visible or not
   */
  visible: boolean;
  /**
   * The height of the bottomsheet @default 200
   */
  title: string;
  height?: number;
  selectedColor: string;
  colorList: readonly string[] | null;
  onChangeColor: (color: string) => void;
  onUpdateColorList: (color: string[]) => void;
  onRequestClose: () => void;
};

const ColorPicker = ({
  visible,
  height,
  title,
  selectedColor,
  colorList,
  onRequestClose,
  onChangeColor,
  onUpdateColorList,
}: ColorPickerProps) => {
  const [state, setState] = useState<
    'addingColor' | 'colorChooser' | 'editingPalette'
  >('colorChooser');

  const onClose = () => {
    if (state === 'colorChooser') {
      onRequestClose();
      return;
    }
    // TODO blink edition button to show that the user can't close the modal
  };

  // #region Adding a color
  const previouslySelectedColor = useRef<string | null>(selectedColor);

  // #region COLOR PALETTE ACTIONS
  const onSelectColor = (color: string) => onChangeColor(color);

  const onValidateColor = useCallback(() => {
    previouslySelectedColor.current = selectedColor;
    onRequestClose();
  }, [onRequestClose, selectedColor]);

  // #endregion

  // #region EDIT PALETTE MODE
  const onEditPalette = useCallback(() => {
    setState('editingPalette');
  }, []);

  const onCancelEditPalette = useCallback(() => {
    setColorsToRemove(new Set());
    setState('colorChooser');
  }, []);
  // #endregion
  // #region EDIT PALETTE ACTION
  const onRequestNewColor = () => {
    previouslySelectedColor.current = selectedColor;
    setState('addingColor');
  };

  const onCancelNewColor = useCallback(() => {
    const previousColor = previouslySelectedColor.current ?? selectedColor;
    onChangeColor(previousColor);
    previouslySelectedColor.current = null;
    setState('colorChooser');
  }, [onChangeColor, selectedColor]);

  const onSaveNewColor = useCallback(() => {
    previouslySelectedColor.current = null;
    //be sure color is uniq (no duplicate)
    if (
      colorList == null ||
      colorList?.findIndex(c => c === selectedColor) === -1
    ) {
      onUpdateColorList(
        colorList ? [...colorList, selectedColor] : [selectedColor],
      );
    }
    setState('colorChooser');
  }, [colorList, onUpdateColorList, selectedColor]);

  // #region Editing palette
  const [colorsToRemove, setColorsToRemove] = useState(new Set<string>());

  const onRemoveColor = useCallback((color: string) => {
    setColorsToRemove(colorsToRemove => {
      const newColorsToRemove = new Set(colorsToRemove);
      newColorsToRemove.add(color);
      return newColorsToRemove;
    });
  }, []);

  const onSavePaletteEdition = useCallback(() => {
    onUpdateColorList((colorList ?? []).filter(c => !colorsToRemove.has(c)));
    setColorsToRemove(new Set());
    setState('colorChooser');
  }, [colorList, colorsToRemove, onUpdateColorList]);
  // #endregion

  const intl = useIntl();
  const { bottom } = useSafeAreaInsets();

  return (
    <BottomSheetModal
      height={height}
      visible={visible}
      headerTitle={
        state === 'colorChooser'
          ? title
          : state === 'editingPalette'
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
              ? onEditPalette
              : state === 'addingColor'
              ? onCancelNewColor
              : onCancelEditPalette
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
              : state === 'addingColor'
              ? onSaveNewColor
              : onSavePaletteEdition
          }
          variant="primary"
        />
      }
      disableGestureInteraction={state !== 'colorChooser'}
      showGestureIndicator={false}
      onRequestClose={onClose}
    >
      {state !== 'addingColor' ? (
        <ColorPalette
          selectedColor={selectedColor}
          colorList={colorList?.filter(c => !colorsToRemove.has(c)) ?? []}
          onSelectColor={onSelectColor}
          onRequestNewColor={onRequestNewColor}
          onRemoveColor={onRemoveColor}
          editMode={state === 'editingPalette'}
          style={{ marginBottom: bottom }}
        />
      ) : (
        <ColorChooser value={selectedColor} onChangeColor={onChangeColor} />
      )}
    </BottomSheetModal>
  );
};

export default ColorPicker;
