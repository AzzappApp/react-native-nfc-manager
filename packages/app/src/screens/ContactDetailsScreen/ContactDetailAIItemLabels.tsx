import { useColorScheme, View } from 'react-native';
import RemixIcon from 'react-native-remix-icon';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Text from '#ui/Text';
import type { IconName } from 'react-native-remix-icon';

export const ContactDetailAIItemLabels = ({
  items,
  limit = -1,
}: {
  items: Array<{
    icon?: string | null;
    name?: string | null;
  }>;
  limit?: number;
}) => {
  const styles = useStyleSheet(stylesheet);
  const appearance = useColorScheme();

  const displayedItems = limit > 0 ? items.splice(0, limit) : items;

  return (
    <View style={styles.container}>
      {displayedItems.map((item, index) => (
        <View key={index} style={styles.itemContainer}>
          <RemixIcon
            name={(item.icon as IconName) || null}
            size="15"
            color={appearance === 'dark' ? colors.white : colors.black}
            fallback={null}
          />
          <Text variant="button">{item.name}</Text>
        </View>
      ))}
    </View>
  );
};

const stylesheet = createStyleSheet(appearance => ({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 5,
    justifyContent: 'center',
    gap: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appearance === 'dark' ? colors.grey900 : colors.grey50,
    borderRadius: 33,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
  },
}));
