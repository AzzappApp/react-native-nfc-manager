import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { Linking, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { shadow } from '#theme';
import { getTextStyle, getTitleStyle } from '#helpers/cardModuleHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenDimensions from '#hooks/useScreenDimensions';
import Button from '#ui/Button';
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
import type { SharedValue } from 'react-native-reanimated';

type CardModuleMediaTextLinkAlternationProps = CardModuleVariantType & {
  cardModuleMedias: CardModuleMedia[];
  onLayout?: (event: LayoutChangeEvent) => void;
  scrollPosition?: SharedValue<number>;
  modulePosition?: SharedValue<number>;
  disableAnimation?: boolean;
};

const CardModuleMediaTextLinkAlternation = ({
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
}: CardModuleMediaTextLinkAlternationProps) => {
  const screenDimension = useScreenDimensions();
  const dimension = providedDimension ?? screenDimension;

  if (!scrollPosition) {
    throw new Error(
      'CardModuleMediaTextLinkAlternation : the alternation component require a scrollPosition',
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

type AlternationItemProps = {
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
}: AlternationItemProps) => {
  const styles = useStyleSheet(stylesheet);
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

  const openLink = () => {
    if (cardModuleMedia.link?.url) {
      Linking.openURL(cardModuleMedia.link?.url ?? '');
    }
  };

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
          <Button
            label={
              cardModuleMedia.link?.label ??
              intl.formatMessage({
                defaultMessage: 'Open',
                description:
                  'CardModuleTextLinkAlternation - defaut action button label',
              })
            }
            style={[
              {
                borderRadius: cardStyle?.buttonRadius,
                backgroundColor: cardModuleColor.content,
              },
              styles.buttonLink,
            ]}
            textStyle={{ color: cardModuleColor.graphic }}
            onPress={openLink}
          />
        </View>
      </AlternationContainer>
    </CardModulePressableTool>
  );
};

const stylesheet = createStyleSheet(appearance => ({
  buttonLink: {
    ...shadow(appearance, 'bottom'), //need specification on shadow
    overflow: 'visible',
    height: 54,
  },
  bottomContainer: {
    justifyContent: 'center',
    flex: 1,
    rowGap: 20,
  },
}));

export default CardModuleMediaTextLinkAlternation;
