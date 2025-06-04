import { FormattedMessage } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import Icon from '#ui/Icon';
import Text from '#ui/Text';

export const ContactDetailAIFooter = () => {
  return (
    <View style={styles.container}>
      <Icon icon="filters_ai_light" size={24} />
      <Text variant="medium">
        <FormattedMessage
          defaultMessage="Contact enriched with azzapp AI - V0.1"
          description="ContactDetailsModal - Description footer for AI profile view"
        />
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 5, alignSelf: 'center' },
});
