import { useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { Linking, Pressable, View } from 'react-native';
import { shadow } from '#theme';
import { getTextStyle, getTitleStyle } from '#helpers/cardModuleHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
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
import type {
  CardModuleColor,
  DisplayMode,
} from '@azzapp/shared/cardModuleHelpers';
import type { Animated, LayoutChangeEvent } from 'react-native';

type CardModuleMediaTextLinkAlternationProps = CardModuleVariantType & {
  cardModuleMedias: CardModuleMedia[];
  onLayout?: (event: LayoutChangeEvent) => void;
  scrollPosition?: Animated.Value;
  modulePosition?: number;
  disableAnimation?: boolean;
  moduleEditing: boolean;
};

const CardModuleMediaTextLinkAlternation = ({
  cardModuleMedias,
  cardModuleColor,
  dimension: providedDimension,
  onLayout,
  displayMode,
  cardStyle,
  setEditableItemIndex,
  scrollPosition,
  modulePosition,
  moduleEditing,
  canPlay,
  webCardViewMode,
}: CardModuleMediaTextLinkAlternationProps) => {
  const screenDimension = useScreenDimensions();
  const dimension = providedDimension ?? screenDimension;

  if (!scrollPosition) {
    throw new Error(
      'CardModuleMediaTextLinkAlternation : the alternation component require a scrollPosition',
    );
  }

  const items =
    webCardViewMode === 'edit'
      ? cardModuleMedias.slice(0, 1)
      : cardModuleMedias;
  return (
    <View
      onLayout={onLayout}
      style={{ backgroundColor: cardModuleColor.background }}
    >
      {items.map((cardModuleMedia, index) => {
        return (
          <AlternationItem
            key={`${cardModuleMedia.media.id}_${index}`}
            cardModuleMedia={cardModuleMedia}
            cardModuleColor={cardModuleColor}
            dimension={dimension}
            displayMode={displayMode}
            cardStyle={cardStyle}
            setEditableItemIndex={setEditableItemIndex}
            scrollPosition={scrollPosition}
            modulePosition={modulePosition}
            index={index}
            moduleEditing={moduleEditing}
            canPlay={canPlay}
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
  displayMode: DisplayMode;
  cardStyle?: CardStyle | null;
  setEditableItemIndex?: (index: number) => void;
  scrollPosition: Animated.Value;
  modulePosition?: number;
  index: number;
  moduleEditing: boolean;
  canPlay: boolean;
};

const AlternationItem = ({
  cardModuleMedia,
  cardModuleColor,
  dimension,
  displayMode,
  cardStyle,
  setEditableItemIndex,
  scrollPosition,
  modulePosition,
  index,
  moduleEditing,
  canPlay,
}: AlternationItemProps) => {
  const styles = useStyleSheet(stylesheet);
  const [parentY, setParentY] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setParentY(event.nativeEvent.layout.y);
  }, []);

  const intl = useIntl();

  const onPressItem = useCallback(() => {
    setEditableItemIndex?.(index);
  }, [index, setEditableItemIndex]);

  const openLink = () => {
    if (moduleEditing) {
      setEditableItemIndex?.(index);
    } else if (!moduleEditing && cardModuleMedia.link?.url) {
      Linking.openURL(cardModuleMedia.link?.url);
    } else {
      Linking.openURL('https://web.azzapp.com/explanation');
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
        displayMode={displayMode}
        dimension={dimension}
        media={cardModuleMedia.media}
        cardStyle={cardStyle}
        index={index}
        parentY={parentY}
        canPlay={canPlay}
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
            <Pressable
              style={[
                {
                  borderRadius: cardStyle?.buttonRadius,
                  backgroundColor: cardModuleColor.content,
                },
                styles.buttonLink,
              ]}
              onPress={openLink}
            >
              <Text
                variant="button"
                style={[
                  getTextStyle(cardStyle, cardModuleColor),
                  { color: cardModuleColor.graphic },
                ]}
              >
                {cardModuleMedia.link?.label ??
                  intl.formatMessage({
                    defaultMessage: 'Open',
                    description:
                      'CardModuleTextLinkAlternation - defaut action button label',
                  })}
              </Text>
            </Pressable>
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
    minWidth: 150,
    justifyContent: 'center',
    alignItems: 'center',
    borderCurve: 'continuous',
    paddingHorizontal: 20,
  },
  bottomContainer: {
    justifyContent: 'center',
    flex: 1,
    rowGap: 20,
  },
  buttonCenter: { alignItems: 'flex-start' },
}));

export default CardModuleMediaTextLinkAlternation;
