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
  moduleEditing: boolean;
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
  moduleEditing,
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
            moduleEditing={moduleEditing}
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
  moduleEditing: boolean;
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
  moduleEditing,
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
    if (!moduleEditing && cardModuleMedia.link?.url) {
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
            {cardModuleMedia.title}
          </Text>
          <Text style={getTextStyle(cardStyle, cardModuleColor)}>
            {cardModuleMedia.text}
          </Text>
          <View style={styles.buttonCenter}>
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
    flexGrow: 0,
    minWidth: 150,
    marginTop: 20,
  },
  bottomContainer: {
    justifyContent: 'center',
    flex: 1,
    rowGap: 20,
  },
  buttonCenter: { alignItems: 'flex-start' },
}));

export default CardModuleMediaTextLinkAlternation;
