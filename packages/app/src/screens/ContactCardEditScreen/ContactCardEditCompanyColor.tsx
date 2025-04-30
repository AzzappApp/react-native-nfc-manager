import {
  AlphaType,
  clamp,
  ColorType,
  useImage,
} from '@shopify/react-native-skia';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useController } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { Platform, Pressable, View } from 'react-native';
import { getColors, cache } from 'react-native-image-colors';
import { isDefined } from '@azzapp/shared/isDefined';
import { colors } from '#theme';
import { DoneHeaderButton } from '#components/commonsButtons';
import { buildContactStyleSheet } from '#helpers/contactHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useBoolean from '#hooks/useBoolean';
import useLatestCallback from '#hooks/useLatestCallback';
import useScreenInsets from '#hooks/useScreenInsets';
import BottomSheetModal from '#ui/BottomSheetModal';
import ColorChooser from '#ui/ColorPicker/ColorChooser';
import Header from '#ui/Header';
import Text from '#ui/Text';
import type { ContactCardFormValues } from './ContactCardSchema';
import type { Control } from 'react-hook-form';
import type {
  ImageColorsResult,
  IOSImageColors,
} from 'react-native-image-colors/build/types';

const ContactCardEditCompanyColor = ({
  control,
}: {
  control: Control<ContactCardFormValues>;
}) => {
  const styles = useStyleSheet(stylesheet);
  const [showColorPicker, openColorPicker, closeColorPicker] = useBoolean();
  const { bottom } = useScreenInsets();
  const {
    field: { value: companyLogo },
  } = useController({
    control,
    name: 'logo',
  });

  const {
    field: { onChange },
  } = useController({
    control,
    name: 'primaryColor',
  });

  const {
    field: { onChange: onChangeExpendableColor },
  } = useController({
    control,
    name: 'expendableColor',
  });

  const [imageColors, setImagesColors] = useState<{
    primary: string;
    secondary?: string;
    detail?: string;
  }>({
    primary: colors.grey400,
    secondary: colors.red400,
    detail: colors.green,
  });

  //onChange cannot be in dependency because it will rerender and block selection of primary color
  const onChangeLatest = useLatestCallback(onChange);
  const setColors = useCallback(
    (colors: ImageColorsResult) => {
      if (Platform.OS === 'ios') {
        onChangeExpendableColor((colors as IOSImageColors).background);
      }
      const primary =
        colors.platform === 'ios' ? colors.primary : colors.dominant;
      const secondary =
        colors.platform === 'ios' ? colors.secondary : colors.vibrant;
      const detail =
        colors.platform === 'ios'
          ? colors.background === '#FFFFFF'
            ? colors.detail
            : colors.background
          : colors.lightVibrant;

      setImagesColors({
        primary,
        secondary: secondary !== primary ? secondary : undefined,
        detail: detail !== primary && detail !== secondary ? detail : undefined,
      });
      onChangeLatest(primary);
    },
    [onChangeLatest, onChangeExpendableColor],
  );

  useEffect(() => {
    if (companyLogo?.id) {
      //look in cache first
      const cachedColors = cache.getItem(companyLogo.id);
      if (cachedColors) {
        setColors(cachedColors);
        //using cache to faster and avoid showing loading screen each time
      } else {
        getColors(companyLogo.uri, {
          fallback: colors.grey600,
          cache: true,
          key: companyLogo.id,
          quality: 'high',
        }).then(colors => {
          setColors(colors);
        });
      }
    }
  }, [companyLogo, onChangeExpendableColor, setColors]);

  const backgroundColor = useBackgroundPixelColor(
    Platform.OS === 'android' ? companyLogo?.uri : null,
    5,
    5,
  );

  useEffect(() => {
    if (Platform.OS === 'android') {
      onChangeExpendableColor(backgroundColor);
    }
  }, [backgroundColor, onChangeExpendableColor]);

  return (
    <Controller
      control={control}
      name="primaryColor"
      render={({ field: { onChange, value } }) => {
        return (
          <>
            <View style={[styles.field, styles.container]}>
              <Text variant="smallbold" style={styles.fieldTitle}>
                <FormattedMessage
                  defaultMessage="Company's colors"
                  description="ContactCardCreationScreen - Company Color"
                />
              </Text>
              <Pressable
                onPress={openColorPicker}
                style={styles.hexColorBox}
                testID="companycolor_color_box"
              >
                <Text variant="medium" testID="companyColor_label_color">
                  {value}
                </Text>
                {value && !Object.values(imageColors).includes(value) && (
                  <ColorPreview color={value} selected onSelect={onChange} />
                )}
              </Pressable>
              <View style={styles.previewView}>
                {Object.values(imageColors)
                  .filter(isDefined)
                  .map((key, index) => {
                    return (
                      <ColorPreview
                        key={index}
                        color={key}
                        selected={value === key}
                        onSelect={onChange}
                      />
                    );
                  })}
              </View>
            </View>
            <BottomSheetModal
              visible={showColorPicker}
              showHandleIndicator={false}
              onDismiss={closeColorPicker}
              dismissKeyboardOnOpening
              height={330 + bottom}
            >
              <Header
                middleElement={
                  <Text variant="large">
                    <FormattedMessage
                      defaultMessage="Company's colors"
                      description="CreateContactCard ColorPicker component hearder title"
                    />
                  </Text>
                }
                rightElement={<DoneHeaderButton onPress={closeColorPicker} />}
              />
              <View style={styles.viewColorPicker}>
                <ColorChooser
                  value={value ?? colors.black}
                  onColorChange={onChange}
                />
              </View>
            </BottomSheetModal>
          </>
        );
      }}
    />
  );
};

const stylesheet = createStyleSheet(appearance => ({
  ...buildContactStyleSheet(appearance),
  viewColorPicker: { paddingHorizontal: 16, paddingTop: 16 },
  colorBox: {
    height: 22,
    width: 34,
    borderWidth: 1,
    borderColor: colors.grey100,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selected: {
    borderWidth: 2,
    borderColor: appearance === 'light' ? colors.black : colors.white,
  },
  colorView: {
    width: 26,
    height: 14,
    borderRadius: 15,
  },
  previewView: { gap: 2, flexDirection: 'row' },
  hexColorBox: {
    gap: 4,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flex: 1,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}));

export default ContactCardEditCompanyColor;

// react-native-image-color cannot determine the background color on android, so with @upmitt, we decide to take the 5,5 pixel
const useBackgroundPixelColor = (
  uri: string | null | undefined,
  x: number,
  y: number,
) => {
  const im = useImage(uri);

  if (im) {
    const pixels = im?.readPixels(x, y, {
      colorType: ColorType.RGBA_F32,
      alphaType: AlphaType.Premul,
      height: 1,
      width: 1,
    });
    if (pixels) {
      const r = clamp(Math.round(pixels[0]! * 255), 0, 255);
      const g = clamp(Math.round(pixels[1]! * 255), 0, 255);
      const b = clamp(Math.round(pixels[2]! * 255), 0, 255);

      // eslint-disable-next-line no-bitwise
      return `#${((1 << 24) + (r << 16) + (g << 8) + b)
        .toString(16)
        .slice(1)
        .toUpperCase()}`;
    }
    return colors.white;
  }
};

const ColorPreview = ({
  color,
  selected,
  onSelect,
}: {
  color: string;
  selected: boolean;
  onSelect: (color: string) => void;
}) => {
  const styles = useStyleSheet(stylesheet);

  const onPress = useCallback(() => {
    onSelect(color);
  }, [color, onSelect]);

  return (
    <Pressable
      style={[styles.colorBox, selected && styles.selected]}
      hitSlop={10}
      onPress={onPress}
      testID={`companycolor_color_preview_${color}`}
    >
      <View style={[styles.colorView, { backgroundColor: color }]} />
    </Pressable>
  );
};
