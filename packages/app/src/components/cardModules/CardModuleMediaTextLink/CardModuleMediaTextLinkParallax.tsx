import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { Linking, Pressable, View } from 'react-native';
import { shadow } from '#theme';
import { getTextStyle, getTitleStyle } from '#helpers/cardModuleHelpers';
import { useStyleSheet, createStyleSheet } from '#helpers/createStyles';
import useScreenDimensions from '#hooks/useScreenDimensions';
import Text from '#ui/Text';
import ParallaxContainer from '../ParallaxContainer';
import CardModulePressableTool from '../tool/CardModulePressableTool';
import type {
  CardModuleDimension,
  CardModuleMedia,
  CardModuleVariantType,
} from '../cardModuleEditorType';
import type { CardStyle } from '@azzapp/shared/cardHelpers';
import type { CardModuleColor } from '@azzapp/shared/cardModuleHelpers';
import type { Animated, LayoutChangeEvent } from 'react-native';

type CardModuleMediaTextLinkParallaxProps = CardModuleVariantType & {
  cardModuleMedias: CardModuleMedia[];
  onLayout?: (event: LayoutChangeEvent) => void;
  scrollPosition?: Animated.Value;
  modulePosition?: number;
  moduleEditing: boolean;
};

const CardModuleMediaTextLinkParallax = ({
  cardModuleMedias,
  cardModuleColor,
  dimension: providedDimension,
  scrollPosition,
  modulePosition,
  onLayout,
  cardStyle,
  setEditableItemIndex,
  displayMode,
  moduleEditing,
}: CardModuleMediaTextLinkParallaxProps) => {
  const screenDimension = useScreenDimensions();
  const dimension = providedDimension ?? screenDimension;

  if (!scrollPosition) {
    throw new Error(
      'CardModuleMediaTextLinkParallax : the parallax component require a scrollPosition',
    );
  }

  const items =
    displayMode === 'edit' ? cardModuleMedias.slice(0, 1) : cardModuleMedias;
  return (
    <View onLayout={onLayout}>
      {items.map((cardModuleMedia, index) => {
        return (
          <ParallaxItem
            key={`${cardModuleMedia.media.id}_${index}`}
            cardModuleMedia={cardModuleMedia}
            cardModuleColor={cardModuleColor}
            cardStyle={cardStyle}
            dimension={dimension}
            index={index}
            setEditableItemIndex={setEditableItemIndex}
            scrollPosition={scrollPosition}
            modulePosition={modulePosition}
            displayMode={displayMode}
            moduleEditing={moduleEditing}
          />
        );
      })}
    </View>
  );
};

const ParallaxItem = ({
  cardModuleMedia,
  cardModuleColor,
  cardStyle,
  dimension,
  index,
  setEditableItemIndex,
  scrollPosition,
  modulePosition,
  displayMode,
  moduleEditing,
}: {
  cardModuleMedia: CardModuleMedia;
  cardModuleColor: CardModuleColor;
  cardStyle?: CardStyle | null;
  dimension: CardModuleDimension;
  index: number;
  disableParallax?: boolean;
  setEditableItemIndex?: (index: number) => void;
  scrollPosition: Animated.Value;
  modulePosition?: number;
  displayMode: 'desktop' | 'edit' | 'mobile';
  moduleEditing: boolean;
}) => {
  const styles = useStyleSheet(stylesheet);
  const onPress = useCallback(() => {
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

  const intl = useIntl();

  return (
    <CardModulePressableTool active={!!setEditableItemIndex} onPress={onPress}>
      <ParallaxContainer
        scrollY={scrollPosition}
        modulePosition={modulePosition}
        dimension={dimension}
        media={cardModuleMedia.media}
        index={index}
        key={`${cardModuleMedia.media.id}_{index}`}
        disableParallax={displayMode !== 'mobile'}
        imageStyle={styles.opacityImage}
        imageContainerStyle={{
          backgroundColor: cardModuleColor.background,
        }}
      >
        <View style={styles.textContainer}>
          <Text
            variant="large"
            style={[
              getTitleStyle(cardStyle, cardModuleColor),
              styles.textStyle,
              displayMode === 'desktop' && { maxWidth: 400 },
            ]}
          >
            {cardModuleMedia.title}
          </Text>
          <Text
            style={[getTextStyle(cardStyle, cardModuleColor), styles.textStyle]}
          >
            {cardModuleMedia.text}
          </Text>
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
                    'CardModuleTextLinkParallax - defaut action button label',
                })}
            </Text>
          </Pressable>
        </View>
      </ParallaxContainer>
    </CardModulePressableTool>
  );
};

const stylesheet = createStyleSheet(appearance => ({
  opacityImage: { opacity: 0.8 },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    rowGap: 20,
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  textStyle: {
    textAlign: 'center',
  },
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
}));

export default CardModuleMediaTextLinkParallax;
