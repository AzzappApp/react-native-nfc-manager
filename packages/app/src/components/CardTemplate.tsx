import { Image } from 'expo-image';
import { ScrollView, View } from 'react-native';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Text from '#ui/Text';
import PremiumIndicator from './PremiumIndicator';
import type { CardTemplateItem } from './CardTemplateList';

type Props = {
  template: CardTemplateItem;
  itemWidth: number;
  imageHeight: number | null;
  maxScrollViewHeight?: number;
  priority: 'high' | 'normal';
  isPremium: boolean;
};

const CardTemplate = ({
  template,
  itemWidth,
  imageHeight,
  maxScrollViewHeight,
  priority,
  isPremium,
}: Props) => {
  const styles = useStyleSheet(stylesheet);

  return (
    <View
      style={{
        width: itemWidth,
        overflow: 'visible',
        borderRadius: 20,
      }}
    >
      <View style={styles.labelContainerHeight}>
        <Text variant="smallbold">{template.label}</Text>
      </View>
      <View
        style={[
          { maxHeight: maxScrollViewHeight },
          imageHeight != null && {
            height: imageHeight,
          },
          styles.webCardContainer,
        ]}
      >
        <ScrollView
          style={[styles.webCardContainerRadius, { flex: 1, borderRadius: 20 }]}
          contentContainerStyle={
            imageHeight != null ? { height: imageHeight } : null
          }
          overScrollMode="never"
        >
          <View style={styles.webCardContainerRadius}>
            {template.previewMedia && (
              <Image
                source={template.previewMedia}
                style={[
                  {
                    width: itemWidth,
                    height: imageHeight!,
                  },
                  styles.webCardContainerRadius,
                ]}
                priority={priority}
              />
            )}
          </View>
        </ScrollView>
        <PremiumIndicator
          isRequired={template.modules.length > 3 && !isPremium}
          style={{ position: 'absolute', right: 17, top: 9 }}
          size={26}
        />
      </View>
    </View>
  );
};

const stylesheet = createStyleSheet(theme => ({
  labelContainerHeight: {
    height: LABEL_CONTAINER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  webCardContainer: {
    marginTop: 10,
    backgroundColor: colors.grey100,
    borderCurve: 'continuous',
    minHeight: '30%',
    borderRadius: 20,
    ...shadow(theme, 'bottom'),
  },
  webCardContainerRadius: {
    borderRadius: ITEM_RADIUS,
    borderCurve: 'continuous',
    overflow: 'hidden',
    flex: 1,
  },
}));

const ITEM_RADIUS = 20;
const LABEL_CONTAINER_HEIGHT = 40;

export default CardTemplate;
