import { Suspense, useCallback, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { View } from 'react-native';
import { useDebouncedCallback } from 'use-debounce';
import { type ColorPalette } from '@azzapp/shared/cardHelpers';
import { useProfileCardColors } from '#components/ProfileColorPicker';
import ActivityIndicator from '#ui/ActivityIndicator';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
import ColorChooser from './ColorChooser';
import ColorTriptychChooser from './ColorTriptychChooser';
import type { ProfileColorPicker_profile$key } from '@azzapp/relay/artifacts/ProfileColorPicker_profile.graphql';

export type ColorPickerProps = {
  /*
   * The display profile
   */
  profile: ProfileColorPicker_profile$key;
  /**
   * whether the bottomsheet is visible or not
   */
  visible: boolean;
  /**
   * The height of the bottomsheet @default 320
   */
  height?: number;
  /**
   * Called when the user close the bottomsheet
   */
  onRequestClose: () => void;
};

const WebcardColorPicker = ({
  visible,
  height = 320,
  profile: profileKey,
  onRequestClose,
}: ColorPickerProps) => {
  const [state, setState] = useState<'dark' | 'light' | 'primary' | 'triptych'>(
    'triptych',
  );

  const intl = useIntl();
  const { colorPalette, onUpdateColorPalette } =
    useProfileCardColors(profileKey);

  const onChangeColorInPalette = useDebouncedCallback((color: string) => {
    const newPalette = { ...colorPalette };
    switch (state) {
      case 'dark':
        newPalette.dark = color;
        break;
      case 'light':
        newPalette.light = color;
        break;
      case 'primary':
        newPalette.primary = color;
        break;
      case 'triptych':
    }
    onUpdateColorPalette(newPalette);
  }, 700);

  const onChangeColorPalette = useCallback(
    (colorPalette: ColorPalette) => {
      onUpdateColorPalette(colorPalette);
    },
    [onUpdateColorPalette],
  );
  const selectedPalette = useRef(colorPalette);

  const onCancel = () => {
    if (state !== 'triptych') {
      onChangeColorPalette(selectedPalette.current);
      setState('triptych');
    } else {
      //restore previous value
      onChangeColorPalette(selectedPalette.current);
      onRequestClose();
    }
  };

  const onClose = useCallback(() => {
    if (state === 'triptych') {
      onRequestClose();
      selectedPalette.current = colorPalette;
      return;
    } else {
      setState('triptych');
    }
  }, [state, onRequestClose, colorPalette]);

  return (
    <BottomSheetModal
      height={height}
      visible={visible}
      headerTitle={
        state === 'triptych'
          ? intl.formatMessage({
              defaultMessage: 'Webcard colors',
              description: 'Webcard ColorPicker component hearder title',
            })
          : intl.formatMessage({
              defaultMessage: 'Edit linked coor',
              description: 'Webcard ColorPicker component header Edit',
            })
      }
      headerLeftButton={
        <Button
          label={intl.formatMessage({
            defaultMessage: 'Cancel',
            description: 'Webcard ColorPicker component Cancel button label',
          })}
          onPress={onCancel}
          variant="secondary"
        />
      }
      headerRightButton={
        <Button
          label={
            state === 'triptych'
              ? intl.formatMessage({
                  defaultMessage: 'Done',
                  description:
                    'Webcard ColorPicker component Done button label',
                })
              : intl.formatMessage({
                  defaultMessage: 'Save',
                  description:
                    'Webcard olorPicker component Save Color button label',
                })
          }
          onPress={onClose}
          variant="primary"
        />
      }
      disableGestureInteraction={state === 'triptych'}
      showGestureIndicator={false}
      onRequestClose={onClose}
    >
      {state === 'triptych' ? (
        <Suspense
          fallback={
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ActivityIndicator />
            </View>
          }
        >
          <ColorTriptychChooser
            size={86}
            colorPalette={colorPalette}
            previousColorPalette={selectedPalette.current}
            onUpdateColorPalette={onChangeColorPalette}
            onSelectColorPaletteType={setState}
          />
        </Suspense>
      ) : (
        <ColorChooser
          value={colorPalette[state]}
          onColorChange={onChangeColorInPalette}
        />
      )}
    </BottomSheetModal>
  );
};

export default WebcardColorPicker;
