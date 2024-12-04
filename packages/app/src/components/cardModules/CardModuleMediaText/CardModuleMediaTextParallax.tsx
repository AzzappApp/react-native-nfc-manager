import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { getTextStyle, getTitleStyle } from '#helpers/cardModuleHelpers';
import useScreenDimensions from '#hooks/useScreenDimensions';
import Text from '#ui/Text';
import ParallaxContainer from '../ParallaxContainer';
import CardModulePressableTool from '../tool/CardModulePressableTool';
import type {
  CardModuleMedia,
  CardModuleVariantType,
} from '../cardModuleEditorType';
import type { LayoutChangeEvent } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type CardModuleMediaTextParallaxProps = CardModuleVariantType & {
  cardModuleMedias: CardModuleMedia[];
  onLayout?: (event: LayoutChangeEvent) => void;
  disableParallax?: boolean;
  scrollPosition?: SharedValue<number>;
  modulePosition?: SharedValue<number>;
};

const CardModuleMediaTextParallax = ({
  viewMode,
  cardModuleMedias,
  cardModuleColor,
  dimension: providedDimension,
  scrollPosition,
  modulePosition,
  onLayout,
  cardStyle,
  disableParallax,
  setEditableItemIndex,
}: CardModuleMediaTextParallaxProps) => {
  const screenDimension = useScreenDimensions();
  const dimension = providedDimension ?? screenDimension;
  const intl = useIntl();

  if (!scrollPosition) {
    throw new Error(
      'CardModuleParallax : the parallax component require a scrollPosition',
    );
  }
  return (
    <View onLayout={onLayout}>
      {cardModuleMedias.map((cardModuleMedia, index) => {
        return (
          <CardModulePressableTool
            onPress={setEditableItemIndex}
            index={index}
            key={`${cardModuleMedia.media.id}_{index}`}
          >
            <ParallaxContainer
              scrollY={scrollPosition}
              modulePosition={modulePosition}
              dimension={dimension}
              media={cardModuleMedia.media}
              index={index}
              key={`${cardModuleMedia.media.id}_{index}`}
              disableParallax={disableParallax}
              style={{
                opacity: 0.8,
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
                  {cardModuleMedia.title ??
                    intl.formatMessage({
                      defaultMessage:
                        'Select your media in the bottom bar to edit the title',
                      description:
                        'Card Module Media Text - Media default Title',
                    })}
                </Text>
                <Text
                  style={[
                    getTextStyle(cardStyle, cardModuleColor),
                    styles.textStyle,
                  ]}
                >
                  {cardModuleMedia.text ??
                    intl.formatMessage({
                      defaultMessage:
                        'Select your media in the bottom bar to edit the description',
                      description:
                        'Card Module Media Text - Media default description',
                    })}
                </Text>
              </View>
            </ParallaxContainer>
          </CardModulePressableTool>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default CardModuleMediaTextParallax;
