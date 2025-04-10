import { FormattedMessage } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { webCardRequiresSubscription } from '@azzapp/shared/subscriptionHelpers';
import { colors } from '#theme';
import Text from '#ui/Text';
import PremiumIndicator from './PremiumIndicator';

const WebCardBuilderSubtitle = ({
  webCard,
}: {
  webCard: { webCardKind: string; isMultiUser: boolean };
}) => {
  return (
    webCardRequiresSubscription(webCard) && (
      <View style={styles.proContainer}>
        <Text variant="medium" style={styles.proText}>
          <FormattedMessage
            defaultMessage="azzapp+ WebCard{azzappA}"
            values={{
              azzappA: <Text variant="azzapp">a</Text>,
            }}
            description="webCard is premium"
          />
        </Text>
        <PremiumIndicator isRequired />
      </View>
    )
  );
};

const styles = StyleSheet.create({
  proContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proText: {
    color: colors.grey400,
  },
});

export default WebCardBuilderSubtitle;
