import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import { getTextStyle, getTitleStyle } from '#helpers/cardModuleHelpers';
import useScreenDimensions from '#hooks/useScreenDimensions';
import Text from '#ui/Text';
import AlternationContainer from '../AlternationContainer';
import CardModulePressableTool from '../tool/CardModulePressableTool';
import type {
  CardModuleDimension,
  CardModuleMedia,
  CardModuleVariantType,
} from '../cardModuleEditorType';
import type { CardStyle } from '@azzapp/shared/cardHelpers';
import type { CardModuleColor } from '@azzapp/shared/cardModuleHelpers';
import type { LayoutChangeEvent } from 'react-native';

type CardModuleMediaTextAlternationProps = CardModuleVariantType & {
  cardModuleMedias: CardModuleMedia[];
  onLayout?: (event: LayoutChangeEvent) => void;
  scrollPosition?: SharedValue<number>;
  modulePosition?: SharedValue<number>;
  disableAnimation?: boolean;
};

const CardModuleMediaTextAlternation = ({
  cardModuleMedias,
  cardModuleColor,
  dimension: providedDimension,
  onLayout,
  viewMode,
  cardStyle,
  setEditableItemIndex,
  scrollPosition,
  modulePosition,
  disableAnimation,
}: CardModuleMediaTextAlternationProps) => {
  const screenDimension = useScreenDimensions();
  const dimension = providedDimension ?? screenDimension;

  if (!scrollPosition) {
    throw new Error(
      'CardModuleMediaTextAlternation : the parallax component require a scrollPosition',
    );
  }

  return (
    <View
      onLayout={onLayout}
      style={{ backgroundColor: cardModuleColor.background }}
    >
      {cardModuleMedias.map((cardModuleMedia, index) => {
        return (
          <AlternationItem
            key={`${cardModuleMedia.media.id}_${index}`}
            cardModuleMedia={cardModuleMedia}
            cardModuleColor={cardModuleColor}
            dimension={dimension}
            viewMode={viewMode}
            cardStyle={cardStyle}
            setEditableItemIndex={setEditableItemIndex}
            scrollPosition={scrollPosition}
            modulePosition={modulePosition}
            index={index}
            disableAnimation={disableAnimation}
          />
        );
      })}
    </View>
  );
};

const AlternationItem = ({
  cardModuleMedia,
  cardModuleColor,
  dimension,
  viewMode,
  cardStyle,
  setEditableItemIndex,
  scrollPosition,
  modulePosition,
  index,
  disableAnimation,
}: {
  cardModuleMedia: CardModuleMedia;
  cardModuleColor: CardModuleColor;
  dimension: CardModuleDimension;
  viewMode: 'desktop' | 'mobile';
  cardStyle?: CardStyle | null;
  setEditableItemIndex?: (index: number) => void;
  scrollPosition: SharedValue<number>;
  modulePosition?: SharedValue<number>;
  index: number;
  disableAnimation?: boolean;
}) => {
  const parentY = useSharedValue(0);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      parentY.value = event.nativeEvent.layout.y;
    },
    [parentY],
  );

  const intl = useIntl();

  const onPressItem = useCallback(() => {
    setEditableItemIndex?.(index);
  }, [index, setEditableItemIndex]);

  return (
    <CardModulePressableTool
      active={!!setEditableItemIndex}
      onPress={onPressItem}
      onLayout={onLayout}
    >
      <AlternationContainer
        scrollY={scrollPosition}
        modulePosition={modulePosition}
        viewMode={viewMode}
        dimension={dimension}
        media={cardModuleMedia.media}
        cardStyle={cardStyle}
        index={index}
        parentY={parentY}
        disableAnimation={disableAnimation}
      >
        <View style={styles.bottomContainer}>
          <Text
            variant="large"
            style={getTitleStyle(cardStyle, cardModuleColor)}
          >
            {cardModuleMedia.title ??
              intl.formatMessage({
                defaultMessage:
                  'Select your media in the bottom bar to edit the title',
                description: 'Card Module Media Text - Media default Title',
              })}
          </Text>
          <Text style={getTextStyle(cardStyle, cardModuleColor)}>
            {cardModuleMedia.text ??
              intl.formatMessage({
                defaultMessage:
                  'Select your media in the bottom bar to edit the description',
                description:
                  'Card Module Media Text - Media default description',
              })}
          </Text>
        </View>
      </AlternationContainer>
    </CardModulePressableTool>
  );
};

const styles = StyleSheet.create({
  bottomContainer: {
    justifyContent: 'center',
    flex: 1,
    rowGap: 20,
  },
});

export default CardModuleMediaTextAlternation;
