import { pick } from 'lodash';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useRelayEnvironment } from 'react-relay';
import {
  DEFAULT_COLOR_PALETTE,
  type ColorPalette,
  DEFAULT_COLOR_LIST,
} from '@azzapp/shared/cardHelpers';
import { useWebCardColorsFragment } from '#components/WebCardColorPicker';
import ActivityIndicator from '#ui/ActivityIndicator';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
import ColorChooser from '#ui/ColorPicker/ColorChooser';
import Text from '#ui/Text';
import ColorTriptychChooser from './ColorTriptychChooser';
import type { WebCardColorPicker_webCard$key } from '@azzapp/relay/artifacts/WebCardColorPicker_webCard.graphql';
import type { StoreUpdater, OptimisticUpdateFunction } from 'relay-runtime';

export type ColorPickerProps = {
  /*
   * The display profile
   */
  webCard: WebCardColorPicker_webCard$key;
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

const WebCardColorPicker = ({
  webCard: webCardKey,
  visible,
  height = 320,
  onRequestClose,
}: ColorPickerProps) => {
  const {
    webCard,
    mutation: [commit, saving],
  } = useWebCardColorsFragment(webCardKey);

  const colorPalette = useMemo(
    () =>
      webCard?.cardColors
        ? pick(webCard?.cardColors, ['primary', 'light', 'dark'])
        : DEFAULT_COLOR_PALETTE,
    [webCard?.cardColors],
  );

  const [currentPalette, setCurrentPalette] =
    useState<ColorPalette>(colorPalette);

  useEffect(() => {
    if (!visible) {
      setCurrentPalette(colorPalette);
    }
  }, [colorPalette, visible]);

  const [editedColor, setEditedColor] = useState<
    'dark' | 'light' | 'primary' | null
  >(null);

  const environment = useRelayEnvironment();
  const optimisticUpdate = useRef<OptimisticUpdateFunction | null>(null);

  const onSave = () => {
    if (saving) {
      return;
    }
    const input = webCard?.cardColors
      ? pick(webCard.cardColors, ['primary', 'light', 'dark', 'otherColors'])
      : {
          ...DEFAULT_COLOR_PALETTE,
          otherColors: DEFAULT_COLOR_LIST,
        };
    commit({
      variables: {
        input,
      },
      updater: webCard?.id
        ? cardColorsStoreUpdater(webCard.id, colorPalette)
        : undefined,
      onCompleted: _ => {
        setCurrentPalette(pick(input, ['primary', 'light', 'dark']));
        onRequestClose();
      },
      onError: error => {
        console.error(error);
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Error while saving colors',
            description:
              'Error toast message when we failed to save colors in webcard color picker',
          }),
        });
      },
    });
  };

  const onUpdateColorPalette = (newPalette: ColorPalette) => {
    if (webCard?.id) {
      const update = {
        storeUpdater: cardColorsStoreUpdater(webCard.id, newPalette),
      };

      if (optimisticUpdate.current) {
        environment.replaceUpdate(optimisticUpdate.current, update);
      } else {
        environment.applyUpdate(update);
      }
      optimisticUpdate.current = update;
    }
  };

  const intl = useIntl();
  const onChangeColorInPalette = (color: string) => {
    const newPalette = { ...colorPalette };
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
  };

  const previousEditedColorValueRef = useRef<string | null>(null);

  const onEditColor = (color: 'dark' | 'light' | 'primary') => {
    setEditedColor(color);
    previousEditedColorValueRef.current = colorPalette[color];
  };

  const onCancelInner = () => {
    if (!editedColor) {
      if (optimisticUpdate.current) {
        environment.revertUpdate(optimisticUpdate.current);
        optimisticUpdate.current = null;
      }
      onRequestClose();
    } else {
      onUpdateColorPalette({
        ...colorPalette,
        [editedColor]: previousEditedColorValueRef.current,
      });
      setEditedColor(null);
    }
  };

  const onRequestCloseInner = () => {
    if (optimisticUpdate.current || editedColor || saving) {
      return;
    }
    onRequestClose();
  };

  const onDone = () => {
    if (!editedColor) {
      onSave();
    } else {
      setEditedColor(null);
    }
  };

  return (
    <BottomSheetModal
      height={height}
      visible={visible}
      headerTitle={
        <Text variant="large">
          {editedColor ? (
            <FormattedMessage
              defaultMessage="Edit linked coor"
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
      headerLeftButton={
        <Button
          label={intl.formatMessage({
            defaultMessage: 'Cancel',
            description: 'Webcard ColorPicker component Cancel button label',
          })}
          onPress={onCancelInner}
          variant="secondary"
          disabled={saving}
        />
      }
      headerRightButton={
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
          loading={saving}
        />
      }
      disableGestureInteraction
      showGestureIndicator={false}
      onRequestClose={onRequestCloseInner}
    >
      {editedColor ? (
        <ColorChooser
          value={colorPalette[editedColor]}
          onColorChange={onChangeColorInPalette}
        />
      ) : (
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
            currentPalette={currentPalette}
            onUpdateColorPalette={onUpdateColorPalette}
            onEditColor={onEditColor}
            saving={saving}
          />
        </Suspense>
      )}
    </BottomSheetModal>
  );
};

export default WebCardColorPicker;

const cardColorsStoreUpdater =
  (webCardId: string, newPalette: ColorPalette): StoreUpdater =>
  store => {
    const webCardRecord = store.get(webCardId);
    if (!webCardRecord) {
      return;
    }
    let colors = webCardRecord.getLinkedRecord('cardColors');

    if (!colors) {
      colors = store.create(`${webCardId}:cardColors`, 'cardColors');
      webCardRecord.setLinkedRecord(colors, 'cardColors');
    }
    colors.setValue(newPalette.primary, 'primary');
    colors.setValue(newPalette.light, 'light');
    colors.setValue(newPalette.dark, 'dark');
  };
