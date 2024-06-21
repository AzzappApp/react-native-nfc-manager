import { FormattedMessage } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import {
  COLOR_PALETTE_COLORS,
  swapColor,
  type ColorPalette,
  type ColorPaletteColor,
} from '@azzapp/shared/cardHelpers';
import { getTextColor } from '@azzapp/shared/colorsHelpers';
import { colors } from '#theme';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { ViewProps } from 'react-native';

type CoverTemplateScratchStartersProps = ViewProps & {
  onColorSelect: (color: ColorPaletteColor) => void;
  cardColors: ColorPalette | null | undefined;
};

const CoverTemplateScratchStarters = ({
  cardColors,
  onColorSelect,
  ...props
}: CoverTemplateScratchStartersProps) => {
  return (
    <View {...props}>
      <Text variant="smallbold" style={styles.label}>
        <FormattedMessage
          defaultMessage="Start from scratch"
          description="CoverTemplateList - Start from scratch"
        />
      </Text>
      <View style={styles.scratchs}>
        {COLOR_PALETTE_COLORS.map(colorName => {
          const color = swapColor(colorName, cardColors);
          return (
            <PressableNative
              key={colorName}
              style={[styles.scratch, { backgroundColor: color }]}
              onPress={() => {
                onColorSelect(colorName);
              }}
            >
              <Icon
                icon="landscape"
                style={{ tintColor: getTextColor(color) }}
              />
            </PressableNative>
          );
        })}
      </View>
    </View>
  );
};

export default CoverTemplateScratchStarters;

const styles = StyleSheet.create({
  label: {
    marginTop: 20,
    marginLeft: 20,
    fontSize: 16,
  },
  scratchs: {
    marginLeft: 20,
    paddingVertical: 10,
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
  },
  scratch: {
    display: 'flex',
    width: 75,
    height: 120,
    paddingVertical: 35,
    paddingHorizontal: 12,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: colors.grey50,
  },
});
