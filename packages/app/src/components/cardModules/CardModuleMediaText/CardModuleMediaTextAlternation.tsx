import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { getTextStyle, getTitleStyle } from '#helpers/cardModuleHelpers';
import useScreenDimensions from '#hooks/useScreenDimensions';
import Text from '#ui/Text';
import AlternationContainer from '../AlternationContainer';
import CardModulePressableTool from '../tool/CardModulePressableTool';
import type {
  CardModuleMedia,
  CardModuleVariantType,
} from '../cardModuleEditorType';
import type { LayoutChangeEvent } from 'react-native';

type CardModuleMediaTextAlternationProps = CardModuleVariantType & {
  cardModuleMedias: CardModuleMedia[];
  onLayout?: (event: LayoutChangeEvent) => void;
};

const CardModuleMediaTextAlternation = ({
  cardModuleMedias,
  cardModuleColor,
  dimension: providedDimension,
  onLayout,
  viewMode,
  cardStyle,
  setEditableItemIndex,
}: CardModuleMediaTextAlternationProps) => {
  const screenDimension = useScreenDimensions();
  const dimension = providedDimension ?? screenDimension;
  const intl = useIntl();
  return (
    <View
      onLayout={onLayout}
      style={{ backgroundColor: cardModuleColor.background }}
    >
      {cardModuleMedias.map((cardModuleMedia, index) => {
        return (
          <CardModulePressableTool
            onPress={setEditableItemIndex}
            index={index}
            key={`${cardModuleMedia.media.id}_{index}`}
          >
            <AlternationContainer
              viewMode={viewMode}
              dimension={dimension}
              media={cardModuleMedia.media}
              cardStyle={cardStyle}
              index={index}
              key={`${cardModuleMedia.media.id}_{index}`}
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
                      description:
                        'Card Module Media Text - Media default Title',
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
      })}
    </View>
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
