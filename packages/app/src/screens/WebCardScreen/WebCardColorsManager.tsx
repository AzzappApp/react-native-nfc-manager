import pick from 'lodash/pick';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Alert, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useRelayEnvironment } from 'react-relay';
import {
  DEFAULT_COLOR_PALETTE,
  type ColorPalette,
  DEFAULT_COLOR_LIST,
} from '@azzapp/shared/cardHelpers';
import ColorTriptychChooser from '#components/ColorTriptychChooser';
import { useWebCardColorsFragment } from '#components/WebCardColorPicker';
import useScreenInsets from '#hooks/useScreenInsets';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
import ColorChooser from '#ui/ColorPicker/ColorChooser';
import Header from '#ui/Header';
import LoadingView from '#ui/LoadingView';
import Text from '#ui/Text';
import type { WebCardColorPicker_webCard$key } from '#relayArtifacts/WebCardColorPicker_webCard.graphql';
import type { StoreUpdater, OptimisticUpdateFunction } from 'relay-runtime';

export type WebCardColorsManagerProps = {
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

  onCloseCanceled: () => void;
};

const WebCardColorsManager = ({
  webCard: webCardKey,
  visible,
  height = 340,
  onRequestClose,
  onCloseCanceled,
}: WebCardColorsManagerProps) => {
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

  const intl = useIntl();

  const onSave = useCallback(() => {
    if (saving || !webCard) {
      return;
    }
    const cardColors = webCard?.cardColors
      ? pick(webCard.cardColors, ['primary', 'light', 'dark', 'otherColors'])
      : {
          ...DEFAULT_COLOR_PALETTE,
          otherColors: DEFAULT_COLOR_LIST,
        };
    commit({
      variables: {
        webCardId: webCard.id,
        input: {
          ...cardColors,
        },
      },
      updater: webCard?.id
        ? cardColorsStoreUpdater(webCard.id, colorPalette)
        : undefined,
      onCompleted: _ => {
        setCurrentPalette(pick(cardColors, ['primary', 'light', 'dark']));
        if (optimisticUpdate.current) {
          environment.revertUpdate(optimisticUpdate.current);
          optimisticUpdate.current = null;
        }
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
  }, [
    saving,
    webCard,
    commit,
    colorPalette,
    onRequestClose,
    environment,
    intl,
  ]);

  const onUpdateColorPalette = useCallback(
    (newPalette: ColorPalette) => {
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
    },
    [environment, webCard?.id],
  );

  const onChangeColorInPalette = useCallback(
    (color: string) => {
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
    },
    [colorPalette, editedColor, onUpdateColorPalette],
  );

  const previousEditedColorValueRef = useRef<string | null>(null);

  const onEditColor = useCallback(
    (color: 'dark' | 'light' | 'primary') => {
      setEditedColor(color);
      previousEditedColorValueRef.current = colorPalette[color];
    },
    [colorPalette],
  );

  const onCancelInner = useCallback(() => {
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
  }, [
    colorPalette,
    editedColor,
    environment,
    onRequestClose,
    onUpdateColorPalette,
  ]);

  const onRequestCloseInner = useCallback(() => {
    if (saving) {
      return;
    }
    onRequestClose();

    if (optimisticUpdate.current || editedColor) {
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
              if (optimisticUpdate.current) {
                environment.revertUpdate(optimisticUpdate.current);
                optimisticUpdate.current = null;
              }
              onRequestClose();
            },
          },
        ],
      );
    }
  }, [editedColor, environment, intl, onCloseCanceled, onRequestClose, saving]);

  const onDone = useCallback(() => {
    if (!editedColor) {
      onSave();
    } else {
      setEditedColor(null);
    }
  }, [editedColor, onSave]);
  const { bottom } = useScreenInsets();
  return (
    <BottomSheetModal
      height={height + bottom}
      visible={visible}
      showHandleIndicator={false}
      onDismiss={onRequestCloseInner}
      dismissKeyboardOnOpening
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
        leftElement={
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
            loading={saving}
          />
        }
        style={{ marginBottom: 20 }}
      />
      <View style={{ paddingHorizontal: 16 }}>
        {editedColor ? (
          <ColorChooser
            value={colorPalette[editedColor]}
            onColorChange={onChangeColorInPalette}
          />
        ) : (
          <Suspense fallback={<LoadingView />}>
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
      </View>
    </BottomSheetModal>
  );
};

export default WebCardColorsManager;

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
