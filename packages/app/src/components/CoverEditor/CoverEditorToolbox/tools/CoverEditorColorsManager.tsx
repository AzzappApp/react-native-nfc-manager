import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Alert, View, StyleSheet } from 'react-native';
import ColorTriptychChooser from '#components/ColorTriptychChooser';
import { useCoverEditorContext } from '#components/CoverEditor/CoverEditorContext';
import useScreenInsets from '#hooks/useScreenInsets';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
import ColorChooser from '#ui/ColorPicker/ColorChooser';
import Header from '#ui/Header';
import LoadingView from '#ui/LoadingView';
import Text from '#ui/Text';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';

export type CoverEditorColorsManagerProps = {
  /**
   * whether the bottomsheet is visible or not
   */
  visible: boolean;
  /**
   * Called when the user close the bottomsheet
   */
  onRequestClose: () => void;

  onCloseCanceled: () => void;
};

const CoverEditorColorsManager = ({
  visible,
  onRequestClose,
  onCloseCanceled,
}: CoverEditorColorsManagerProps) => {
  const {
    coverEditorState: { cardColors },
    dispatch,
  } = useCoverEditorContext();

  const [editedColor, setEditedColor] = useState<
    'dark' | 'light' | 'primary' | null
  >(null);

  const savedColors = useRef(cardColors);
  const hasChanges = useRef(false);
  const closeRequested = useRef(false);

  useEffect(() => {
    if (visible) {
      closeRequested.current = false;
    }
  }, [visible]);
  const revertColors = useCallback(() => {
    if (hasChanges.current) {
      dispatch({
        type: 'UPDATE_CARD_COLORS',
        payload: savedColors.current,
      });
      hasChanges.current = false;
    }
  }, [dispatch]);

  const onUpdateColorPalette = useCallback(
    (newPalette: ColorPalette) => {
      hasChanges.current = true;
      dispatch({
        type: 'UPDATE_CARD_COLORS',
        payload: { ...newPalette, otherColors: cardColors.otherColors },
      });
    },
    [dispatch, cardColors],
  );

  const onChangeColorInPalette = useCallback(
    (color: string) => {
      const newPalette = { ...cardColors };
      switch (editedColor) {
        case 'dark':
          newPalette.dark = color;
          break;
        case 'light':
          newPalette.light = color;
          break;
        case 'primary':
          newPalette.primary = color;
          break;
        default:
          break;
      }
      onUpdateColorPalette(newPalette);
    },
    [cardColors, editedColor, onUpdateColorPalette],
  );

  const previousEditedColorValueRef = useRef<string | null>(null);

  const onEditColor = useCallback(
    (color: 'dark' | 'light' | 'primary') => {
      setEditedColor(color);
      previousEditedColorValueRef.current = cardColors[color];
    },
    [cardColors],
  );

  const onCancelInner = useCallback(() => {
    closeRequested.current = true;
    if (!editedColor) {
      revertColors();
      onRequestClose();
    } else {
      onUpdateColorPalette({
        ...cardColors,
        [editedColor]: previousEditedColorValueRef.current,
      });
      setEditedColor(null);
    }
  }, [
    cardColors,
    editedColor,
    onRequestClose,
    onUpdateColorPalette,
    revertColors,
  ]);

  const intl = useIntl();
  const onDismiss = useCallback(() => {
    onRequestClose();
    if (closeRequested.current) {
      return;
    }
    if (hasChanges.current || editedColor) {
      Alert.alert(
        intl.formatMessage({
          defaultMessage: 'Cancel changes on colors?',
          description:
            'Webcard ColorPicker component unsaved changes alert title',
        }),
        intl.formatMessage({
          defaultMessage:
            'You have unsaved changes on colors, do you really want to cancel?',
          description:
            'Webcard ColorPicker component unsaved changes alert message',
        }),
        [
          {
            text: intl.formatMessage({
              defaultMessage: 'No',
              description:
                'Webcard ColorPicker component unsaved changes alert Cancel button label',
            }),
            onPress: onCloseCanceled,
            style: 'cancel',
          },
          {
            text: intl.formatMessage({
              defaultMessage: 'Yes',
              description:
                'Webcard ColorPicker component unsaved changes alert Yes button label',
            }),
            onPress: () => {
              revertColors();
              onRequestClose();
            },
          },
        ],
      );
    }
  }, [editedColor, intl, onCloseCanceled, onRequestClose, revertColors]);

  const onDone = useCallback(() => {
    closeRequested.current = true;
    if (!editedColor) {
      savedColors.current = cardColors;
      onRequestClose();
    } else {
      setEditedColor(null);
    }
  }, [cardColors, editedColor, onRequestClose]);
  const { bottom } = useScreenInsets();
  return (
    <BottomSheetModal
      visible={visible}
      showHandleIndicator={false}
      onDismiss={onDismiss}
      dismissKeyboardOnOpening
      height={330 + bottom}
    >
      <Header
        middleElement={
          <Text variant="large">
            {editedColor ? (
              <FormattedMessage
                defaultMessage="Edit linked color"
                description="Webcard ColorPicker component header Edit"
              />
            ) : (
              <FormattedMessage
                defaultMessage="Webcard{azzappA} colors"
                description="Webcard ColorPicker component hearder title"
                values={{
                  azzappA: <Text variant="azzapp">a</Text>,
                }}
              />
            )}
          </Text>
        }
        rightElement={
          <Button
            label={
              editedColor
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
            onPress={onDone}
            variant="primary"
          />
        }
        leftElement={
          <Button
            label={intl.formatMessage({
              defaultMessage: 'Cancel',
              description: 'Webcard ColorPicker component Cancel button label',
            })}
            onPress={onCancelInner}
            variant="secondary"
          />
        }
      />
      <View style={styles.viewColorPicker}>
        {editedColor ? (
          <ColorChooser
            value={cardColors[editedColor]}
            onColorChange={onChangeColorInPalette}
          />
        ) : (
          <Suspense fallback={<LoadingView />}>
            <ColorTriptychChooser
              size={86}
              colorPalette={cardColors}
              currentPalette={savedColors?.current}
              onUpdateColorPalette={onUpdateColorPalette}
              onEditColor={onEditColor}
            />
          </Suspense>
        )}
      </View>
    </BottomSheetModal>
  );
};

export default CoverEditorColorsManager;

const styles = StyleSheet.create({
  viewColorPicker: { paddingHorizontal: 16, paddingTop: 16 },
});
