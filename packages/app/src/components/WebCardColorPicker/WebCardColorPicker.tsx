import { pick } from 'lodash';
import { Suspense, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { View } from 'react-native';
import {
  graphql,
  useFragment,
  useMutation,
  useRelayEnvironment,
} from 'react-relay';
import {
  DEFAULT_COLOR_PALETTE,
  type ColorPalette,
  DEFAULT_COLOR_LIST,
} from '@azzapp/shared/cardHelpers';
import ActivityIndicator from '#ui/ActivityIndicator';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
import ColorChooser from '#ui/ColorPicker/ColorChooser';
import ColorTriptychChooser from './ColorTriptychChooser';
import type { WebCardColorPicker_profile$key } from '@azzapp/relay/artifacts/WebCardColorPicker_profile.graphql';
import type { WebCardColorPickerMutation } from '@azzapp/relay/artifacts/WebCardColorPickerMutation.graphql';
import type { Disposable } from 'react-relay';

export type ColorPickerProps = {
  /*
   * The display profile
   */
  profile: WebCardColorPicker_profile$key;
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
  profile: profileKey,
  visible,
  height = 320,
  onRequestClose,
}: ColorPickerProps) => {
  const profile = useFragment(
    graphql`
      fragment WebCardColorPicker_profile on Profile {
        id
        cardColors {
          primary
          light
          dark
          otherColors
        }
      }
    `,
    profileKey,
  );

  const colorPalette =
    profile.cardColors ??
    pick(profile.cardColors, ['primary', 'light', 'dark']) ??
    DEFAULT_COLOR_PALETTE;

  const [commit, saving] = useMutation<WebCardColorPickerMutation>(graphql`
    mutation WebCardColorPickerMutation($input: SaveCardColorsInput!) {
      saveCardColors(input: $input) {
        profile {
          id
          cardColors {
            primary
            light
            dark
            otherColors
          }
        }
      }
    }
  `);

  const [currentPalette, setCurrentPalette] =
    useState<ColorPalette>(colorPalette);

  const [editedColor, setEditedColor] = useState<
    'dark' | 'light' | 'primary' | null
  >(null);

  const environment = useRelayEnvironment();
  const optimisticUpdate = useRef<Disposable | null>(null);

  const onSave = () => {
    if (saving) {
      return;
    }
    const input = profile.cardColors
      ? pick(profile.cardColors, ['primary', 'light', 'dark', 'otherColors'])
      : {
          ...DEFAULT_COLOR_PALETTE,
          otherColors: DEFAULT_COLOR_LIST,
        };
    commit({
      variables: {
        input,
      },
      optimisticResponse: {
        saveCardColors: {
          profile: {
            id: profile.id,
            cardColors: colorPalette,
          },
        },
      },
      onCompleted: (_, error) => {
        if (error) {
          //TODO: handle error
          console.log(error);
          return;
        }
        optimisticUpdate.current?.dispose();
        setCurrentPalette(pick(input, ['primary', 'light', 'dark']));
        onRequestClose();
      },
      onError: error => {
        //TODO: handle error
        console.log(error);
      },
    });
  };

  const onUpdateColorPalette = (newPalette: ColorPalette) => {
    optimisticUpdate.current = environment.applyUpdate({
      storeUpdater: store => {
        const profileRecord = store.get(profile.id);
        if (!profileRecord) {
          return;
        }
        let colors = profileRecord.getLinkedRecord('cardColors');

        if (!colors) {
          colors = store.create(`${profile.id}:cardColors`, 'CardColors');
          profileRecord.setLinkedRecord(colors, 'cardColors');
        }
        colors.setValue(newPalette.primary, 'primary');
        colors.setValue(newPalette.light, 'light');
        colors.setValue(newPalette.dark, 'dark');
      },
    });
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
      optimisticUpdate.current?.dispose();
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
        editedColor
          ? intl.formatMessage({
              defaultMessage: 'Edit linked coor',
              description: 'Webcard ColorPicker component header Edit',
            })
          : intl.formatMessage({
              defaultMessage: 'Webcard colors',
              description: 'Webcard ColorPicker component hearder title',
            })
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
