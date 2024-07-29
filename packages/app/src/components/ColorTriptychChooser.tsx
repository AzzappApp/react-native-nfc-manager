import { memo, useCallback, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { FlatList, useWindowDimensions, View } from 'react-native';
import { graphql, useLazyLoadQuery } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { getTextColor } from '@azzapp/shared/colorsHelpers';
import { colors, shadow } from '#theme';
import ColorTriptychRenderer from '#components/ColorTriptychRenderer';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { keyExtractor } from '#helpers/idHelpers';
import useAuthState from '#hooks/useAuthState';
import Icon from '#ui/Icon';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import type { ColorTriptychChooserQuery } from '#relayArtifacts/ColorTriptychChooserQuery.graphql';
import type { PressableOpacityProps } from '#ui/PressableOpacity';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';
import type { ListRenderItemInfo } from 'react-native';

export type ColorTriptychChooserProps = {
  size: number;
  colorPalette: ColorPalette;
  currentPalette: ColorPalette;
  saving?: boolean;
  onUpdateColorPalette: (colorPalette: ColorPalette) => void;
  onEditColor: (state: 'dark' | 'light' | 'primary') => void;
};

const ColorTriptychChooser = ({
  size,
  colorPalette,
  currentPalette,
  saving = false,
  onEditColor,
  onUpdateColorPalette,
}: ColorTriptychChooserProps) => {
  const { profileInfos } = useAuthState();
  const { profile } = useLazyLoadQuery<ColorTriptychChooserQuery>(
    graphql`
      query ColorTriptychChooserQuery($profileId: ID!, $skip: Boolean!) {
        profile: node(id: $profileId) @skip(if: $skip) {
          ... on Profile {
            colorPalettes(first: 100) {
              edges {
                node {
                  id
                  dark
                  primary
                  light
                }
              }
            }
          }
        }
      }
    `,
    {
      profileId: profileInfos?.profileId as any,
      skip: !profileInfos?.profileId,
    },
  );

  const styles = useStyleSheet(stylesheet);

  const onPressprimary = useCallback(() => {
    onEditColor('primary');
  }, [onEditColor]);

  const onPressdark = useCallback(() => {
    onEditColor('dark');
  }, [onEditColor]);

  const onPresslight = useCallback(() => {
    onEditColor('light');
  }, [onEditColor]);

  const onSelectTriptychColor = useCallback(
    (colorPalette: ColorPaletteItem) => {
      const { id, ...rest } = colorPalette;
      onUpdateColorPalette(rest);
    },
    [onUpdateColorPalette],
  );

  const renderTryptich = useCallback(
    ({ item }: ListRenderItemInfo<ColorPaletteItem>) => {
      return (
        <TriptychItem
          item={item}
          onSelectTripTych={onSelectTriptychColor}
          disabled={saving}
          selected={
            item.primary === colorPalette.primary &&
            item.dark === colorPalette.dark &&
            item.light === colorPalette.light
          }
        />
      );
    },
    [
      colorPalette.dark,
      colorPalette.light,
      colorPalette.primary,
      onSelectTriptychColor,
      saving,
    ],
  );

  const colorPalettesList: ColorPaletteItem[] = useMemo(() => {
    return convertToNonNullArray(
      profile?.colorPalettes?.edges?.map(edge => edge?.node) ?? [],
    );
  }, [profile?.colorPalettes?.edges]);

  const onRestorePreviousTriptych = useCallback(() => {
    onUpdateColorPalette(currentPalette);
  }, [onUpdateColorPalette, currentPalette]);
  const { width } = useWindowDimensions();

  return (
    <View>
      <View
        style={{
          alignItems: 'center',
          height: 150,
          marginTop: 20,
          justifyContent: 'center',
        }}
      >
        <View style={{ width: size, height: size }}>
          <ColorTriptychRenderer
            width={size}
            height={size}
            primary={colorPalette.primary ?? colors.red400}
            dark={colorPalette.dark ?? colors.black}
            light={colorPalette.light}
          />
          <View
            style={{
              position: 'absolute',
              top: -size / RATIO_PRESS - 10,
              width,
              left: (-width + size) / 2,
            }}
          >
            <Text
              variant="xsmall"
              style={{
                color: colors.grey200,
                width: '100%',
                textAlign: 'center',
              }}
            >
              <FormattedMessage
                defaultMessage="Main color"
                description="ColorTriptych choose - Main color"
              />
            </Text>
          </View>
          <View
            style={{
              position: 'absolute',
              left: -size / RATIO_PRESS - 70,
              bottom: 0,
              width: 80,
            }}
          >
            <Text
              variant="xsmall"
              style={{
                color: colors.grey200,
                textAlign: 'right',
              }}
            >
              <FormattedMessage
                defaultMessage="Dark"
                description="ColorTriptych choose - Dark color"
              />
            </Text>
          </View>
          <View
            style={{
              position: 'absolute',
              end: -size / RATIO_PRESS - 20,
              bottom: 0,
            }}
          >
            <Text variant="xsmall" style={{ color: colors.grey200 }}>
              <FormattedMessage
                defaultMessage="Light"
                description="ColorTriptych choose - Light color"
              />
            </Text>
          </View>
          <Text />
          <PressableSlice
            onPress={onPressprimary}
            size={size}
            style={{
              top: (-size / RATIO_PRESS) * PRESSABLE_OFFSET_FACTOR,
              left: (size - size / RATIO_PRESS) / 2,
            }}
            color={colorPalette.primary}
            testID={'primary-color-button'}
            disabled={saving}
            disabledOpacity={1}
          />
          <PressableSlice
            onPress={onPressdark}
            size={size}
            style={{
              bottom: (-size / RATIO_PRESS) * (1 - PRESSABLE_OFFSET_FACTOR),
              left: -size / RATIO_PRESS / 2 - size / RATIO_PRESS / 10,
            }}
            color={colorPalette.dark}
            testID={'dark-color-button'}
            disabled={saving}
            disabledOpacity={1}
          />
          <PressableSlice
            onPress={onPresslight}
            size={size}
            style={{
              bottom: (-size / RATIO_PRESS) * (1 - PRESSABLE_OFFSET_FACTOR),
              right: -size / RATIO_PRESS / 2 - size / RATIO_PRESS / 10,
            }}
            color={colorPalette.light}
            testID={'light-color-button'}
            disabled={saving}
            disabledOpacity={1}
          />
        </View>
      </View>
      <View
        style={{
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <Text variant="smallbold">
          <FormattedMessage
            defaultMessage="Pre-defined colors"
            description="ColorTriptychChoose - predefined colors section title"
          />
        </Text>
      </View>
      <View style={{ flexDirection: 'row', height: 58 }}>
        <View
          style={{
            width: 50,
            height: 30,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
          }}
        >
          <PressableOpacity
            style={[styles.colorPaletteContainer]}
            onPress={onRestorePreviousTriptych}
          >
            <ColorTriptychRenderer width={20} height={20} {...currentPalette} />
          </PressableOpacity>
          <View style={styles.separatingDot} />
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ height: 30 }}
          contentContainerStyle={{ columnGap: 5 }}
          data={colorPalettesList}
          keyExtractor={keyExtractor}
          renderItem={renderTryptich}
          extraData={colorPalette}
        />
      </View>
    </View>
  );
};

type ColorPaletteItem = ColorPalette & { id: string };

export default ColorTriptychChooser;

// the ratio size between the central circle and the pressable circle around it
const RATIO_PRESS = 1.72;
// the offset factor to center the pressable circle around the central circle
const PRESSABLE_OFFSET_FACTOR = 7 / 10;
// the icon ratio based on size of the tryptich
const RATIO_ICON = 0.279;

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
type PressableSlideComponentProps = PressableOpacityProps & {
  size: number;
  color: string;
};

const PressableSliceComponent = ({
  size,
  style,
  color,
  ...props
}: PressableSlideComponentProps) => {
  const styles = useStyleSheet(stylesheet);
  const readableColor = useMemo(() => getTextColor(color), [color]);
  return (
    <PressableOpacity
      activeOpacity={0.5}
      hitSlop={{
        top: 10,
        bottom: size / 5,
        right: size / 5,
        left: size / 5,
      }}
      style={[
        styles.buttonContainerCommon,
        {
          width: size / RATIO_PRESS,
          height: size / RATIO_PRESS,
          borderRadius: size / RATIO_PRESS / 2,
          backgroundColor: color,
        },
        style,
      ]}
      {...props}
    >
      <Icon
        icon="edit"
        style={{
          tintColor: readableColor,
          width: size * RATIO_ICON,
          height: size * RATIO_ICON,
        }}
      />
    </PressableOpacity>
  );
};

const PressableSlice = memo(PressableSliceComponent);

const TriptychItemComponent = ({
  item,
  onSelectTripTych,
  disabled,
  selected,
}: {
  item: ColorPaletteItem;
  onSelectTripTych: (colorPalette: ColorPaletteItem) => void;
  disabled?: boolean;
  selected?: boolean;
}) => {
  const styles = useStyleSheet(stylesheet);

  const onPress = useCallback(() => {
    onSelectTripTych(item);
  }, [item, onSelectTripTych]);

  return (
    <View
      style={{
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <PressableOpacity
        style={[
          styles.colorPaletteContainer,
          selected && styles.colorPaletteSelected,
        ]}
        onPress={onPress}
        disabled={disabled}
        disabledOpacity={1}
      >
        <ColorTriptychRenderer width={20} height={20} {...item} />
      </PressableOpacity>
    </View>
  );
};

//got hunderds of items
const TriptychItem = memo(TriptychItemComponent);

const PALETTE_LIST_HEIGHT = 30;

const stylesheet = createStyleSheet(appearance => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
  },
  buttonContainerCommon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    position: 'absolute',
    ...shadow(appearance, 'bottom'),
  },
  colorPaletteContainer: {
    width: PALETTE_LIST_HEIGHT,
    height: PALETTE_LIST_HEIGHT,
    borderRadius: PALETTE_LIST_HEIGHT / 2,
    borderWidth: 3,
    borderColor: appearance === 'dark' ? colors.grey900 : colors.grey100,
    transform: [{ scale: 0.8 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPaletteSelected: {
    borderColor: appearance === 'dark' ? colors.white : colors.black,
    transform: [{ scale: 1 }],
  },
  separatingDot: {
    marginLeft: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appearance === 'dark' ? colors.white : colors.black,
  },
}));
