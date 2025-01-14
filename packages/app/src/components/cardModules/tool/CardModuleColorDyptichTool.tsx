import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { swapColor } from '@azzapp/shared/cardHelpers';
import { colors } from '#theme';
import { areCardModuleColorEqual } from '#helpers/cardModuleColorsHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenDimensions from '#hooks/useScreenDimensions';
import PressableOpacity from '#ui/PressableOpacity';
import type { CardModuleColor } from '@azzapp/shared/cardModuleHelpers';

type CardModuleColorToolProps = {
  cardColors: {
    readonly dark: string;
    readonly light: string;
    readonly primary: string;
  };
  cardModuleColor: CardModuleColor;
  onModuleColorChange: (moduleColor: CardModuleColor) => void;
  variantColor: CardModuleColor[];
};

const CardModuleColorDyptichTool = ({
  cardColors,
  cardModuleColor,
  onModuleColorChange,
  variantColor,
}: CardModuleColorToolProps) => {
  const styles = useStyleSheet(stylesheet);
  const { width } = useScreenDimensions();
  const totalWidth =
    variantColor.length * ITEM_SIZE + (variantColor.length - 1) * ITEM_GAP - 32; //32 is for safety margin

  const content = useMemo(() => {
    return variantColor.map((dyptich, index) => {
      return (
        <DyptichItem
          key={`cardmodulecolor-dyptichtool-${index}`}
          dyptich={dyptich}
          cardColors={cardColors}
          cardModuleColor={cardModuleColor}
          onModuleColorChange={onModuleColorChange}
        />
      );
    });
  }, [cardColors, cardModuleColor, onModuleColorChange, variantColor]);

  if (totalWidth < width) {
    return (
      <View
        style={{
          width,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 20,
        }}
      >
        {content}
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      contentContainerStyle={[styles.contentContainerStyle]}
      showsHorizontalScrollIndicator={false}
      contentOffset={{ x: 0, y: 0 }}
      style={[styles.scrollViewStyle, { width }]} // get place for more readability
    >
      {content}
    </ScrollView>
  );
};

type ColorPaletteItem = {
  dyptich: CardModuleColor;
  cardColors: {
    readonly dark: string;
    readonly light: string;
    readonly primary: string;
  };
  cardModuleColor: CardModuleColor;
  onModuleColorChange: (color: CardModuleColor) => void;
};

const DyptichItem = ({
  dyptich,
  cardColors,
  cardModuleColor,
  onModuleColorChange,
}: ColorPaletteItem) => {
  const styles = useStyleSheet(stylesheet);
  const isSelected = areCardModuleColorEqual(dyptich, cardModuleColor);
  const onPress = useCallback(() => {
    onModuleColorChange(dyptich);
  }, [dyptich, onModuleColorChange]);

  return (
    <PressableOpacity onPress={onPress}>
      <View
        style={[styles.container, isSelected && styles.selectedBorderItems]}
      >
        {/* this view is for the small border on external circle, adding the width
        on the first circle screw a little the position calculation. Easier to
        add a view around */}
        <View style={styles.externalCircle}>
          {[
            dyptich.background,
            dyptich.content,
            dyptich.title,
            dyptich.text,
            dyptich.graphic,
          ].map((color, index) => {
            const circleWidth =
              CENTER_CIRCLE +
              (Object.keys(dyptich).length - index) * CIRCLE_INCREMENT;
            const positionOffset = (index * CIRCLE_INCREMENT) / 2;

            return (
              <View
                key={index}
                style={[
                  styles.circle,
                  {
                    backgroundColor: swapColor(color, cardColors),
                    width: circleWidth,
                    aspectRatio: 1,
                    top: positionOffset,
                    left: positionOffset,
                    borderRadius: circleWidth / 2,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    </PressableOpacity>
  );
};

export default CardModuleColorDyptichTool;

// this function extract the attribute name of the color for the module in case of OneModuleColor

const SELECTED_BORDER_SIZE = 2;
const EXTERNAL_BORDER_SIZE = 1;
const CENTER_CIRCLE = 16;
const CIRCLE_INCREMENT = 9;
const ITEM_SIZE = CIRCLE_INCREMENT * 5 + CENTER_CIRCLE;
const ITEM_GAP = 10;

const stylesheet = createStyleSheet(appearance => ({
  container: {
    width: ITEM_SIZE + 2 * (SELECTED_BORDER_SIZE + EXTERNAL_BORDER_SIZE),
    height: ITEM_SIZE + 2 * (SELECTED_BORDER_SIZE + EXTERNAL_BORDER_SIZE),
  },
  circle: {
    position: 'absolute',
  },
  externalCircle: {
    width: ITEM_SIZE + 2 * EXTERNAL_BORDER_SIZE,
    height: ITEM_SIZE + 2 * EXTERNAL_BORDER_SIZE,
    borderRadius: (ITEM_SIZE + 2 * EXTERNAL_BORDER_SIZE) / 2,
    borderWidth: EXTERNAL_BORDER_SIZE,
    borderColor: appearance === 'light' ? colors.grey100 : colors.grey800,
  },
  selectedBorderItems: {
    borderColor: appearance === 'light' ? colors.black : colors.white,
    borderWidth: 2,
    borderRadius:
      (ITEM_SIZE + 2 * (SELECTED_BORDER_SIZE + EXTERNAL_BORDER_SIZE)) / 2,
  },
  scrollViewStyle: {
    height: ITEM_SIZE + 2 * (SELECTED_BORDER_SIZE + EXTERNAL_BORDER_SIZE),
    marginTop: 20,
    marginBottom: 20,
  },
  contentContainerStyle: {
    flexDirection: 'row',
    height: 67,
    gap: ITEM_GAP,
    paddingHorizontal: 16,
  },
}));
