import { FormattedMessage } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import Icon from '#ui/Icon';
import Text from '#ui/Text';

export const ContactDetailAIFooter = ({
  version = 'V0.1',
}: {
  version?: string;
}) => {
  return (
    <View style={styles.container}>
      <Icon icon="filters_ai_light" size={24} />
      <Text variant="medium">
        <FormattedMessage
          defaultMessage="Profile built with azzapp AI - {version}"
          description="ContactDetailsModal - Description footer for AI profile view"
          values={{
            version,
          }}
        />
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 5, alignSelf: 'center' },
});
