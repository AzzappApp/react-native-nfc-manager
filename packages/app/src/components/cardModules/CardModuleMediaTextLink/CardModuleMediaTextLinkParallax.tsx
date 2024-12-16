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
import type { LayoutChangeEvent } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type CardModuleMediaTextLinkParallaxProps = CardModuleVariantType & {
  cardModuleMedias: CardModuleMedia[];
  onLayout?: (event: LayoutChangeEvent) => void;
  disableParallax?: boolean;
  scrollPosition?: SharedValue<number>;
  modulePosition?: SharedValue<number>;
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
  disableParallax,
  setEditableItemIndex,
  viewMode,
  moduleEditing,
  webCardEditing,
}: CardModuleMediaTextLinkParallaxProps) => {
  const screenDimension = useScreenDimensions();
  const dimension = providedDimension ?? screenDimension;

  if (!scrollPosition) {
    throw new Error(
      'CardModuleMediaTextLinkParallax : the parallax component require a scrollPosition',
    );
  }
  return (
    <View onLayout={onLayout}>
      {webCardEditing && cardModuleMedias.length > 0 ? (
        <ParallaxItem
          key={`${cardModuleMedias[0].media.id}_${0}`}
          cardModuleMedia={cardModuleMedias[0]}
          cardModuleColor={cardModuleColor}
          cardStyle={cardStyle}
          dimension={dimension}
          index={0}
          disableParallax={disableParallax}
          setEditableItemIndex={setEditableItemIndex}
          scrollPosition={scrollPosition}
          modulePosition={modulePosition}
          viewMode={viewMode}
          moduleEditing={moduleEditing}
        />
      ) : (
        cardModuleMedias.map((cardModuleMedia, index) => {
          return (
            <ParallaxItem
              key={`${cardModuleMedia.media.id}_${index}`}
              cardModuleMedia={cardModuleMedia}
              cardModuleColor={cardModuleColor}
              cardStyle={cardStyle}
              dimension={dimension}
              index={index}
              disableParallax={disableParallax}
              setEditableItemIndex={setEditableItemIndex}
              scrollPosition={scrollPosition}
              modulePosition={modulePosition}
              viewMode={viewMode}
              moduleEditing={moduleEditing}
            />
          );
        })
      )}
    </View>
  );
};

const ParallaxItem = ({
  cardModuleMedia,
  cardModuleColor,
  cardStyle,
  dimension,
  index,
  disableParallax,
  setEditableItemIndex,
  scrollPosition,
  modulePosition,
  viewMode,
  moduleEditing,
}: {
  cardModuleMedia: CardModuleMedia;
  cardModuleColor: CardModuleColor;
  cardStyle?: CardStyle | null;
  dimension: CardModuleDimension;
  index: number;
  disableParallax?: boolean;
  setEditableItemIndex?: (index: number) => void;
  scrollPosition: SharedValue<number>;
  modulePosition?: SharedValue<number>;
  viewMode: 'desktop' | 'mobile';
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
      Linking.openURL(cardModuleMedia.link?.url ?? '');
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
        disableParallax={disableParallax}
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
              viewMode === 'desktop' && { maxWidth: 400 },
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
              viewMode === 'mobile' && { width: '100%' },
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
