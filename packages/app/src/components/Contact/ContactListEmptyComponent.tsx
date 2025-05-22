import { FormattedMessage } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import EmptyContent from '#components/ui/EmptyContent';

const ContactListEmptyComponent = () => {
  return (
    <View style={styles.emptyScreenContainer}>
      <EmptyContent
        message={
          <FormattedMessage
            defaultMessage="No results"
            description="Empty contact list message title"
          />
        }
      />
    </View>
  );
};
export default ContactListEmptyComponent;

const styles = StyleSheet.create({
  emptyScreenContainer: {
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
