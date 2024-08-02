import { FormattedMessage } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import {
  hasModuleKindSubscription,
  isWebCardKindSubscription,
  MODULE_COUNT_LIMIT_FOR_SUBSCRIPTION,
  moduleCountRequiresSubscription,
  webCardRequiresSubscription,
} from '@azzapp/shared/subscriptionHelpers';
import { colors } from '#theme';
import Text from '#ui/Text';
import PremiumIndicator from './PremiumIndicator';

const WebCardBuilderSubtitle = ({
  modules,
  webCard,
}: {
  modules: ReadonlyArray<{ readonly kind: string }>;
  webCard: { webCardKind: string; isMultiUser: boolean };
}) => {
  return (
    webCardRequiresSubscription(modules, webCard) && (
      <View style={styles.proContainer}>
        <Text variant="medium" style={styles.proText}>
          {isWebCardKindSubscription(webCard.webCardKind) ? (
            <FormattedMessage
              defaultMessage="azzapp+ WebCard{azzappA}"
              values={{
                azzappA: <Text variant="azzapp">a</Text>,
              }}
              description="webCard is premium"
            />
          ) : moduleCountRequiresSubscription(modules.length) ? (
            <FormattedMessage
              defaultMessage="{count}+ sections"
              values={{
                count: MODULE_COUNT_LIMIT_FOR_SUBSCRIPTION,
              }}
              description="webCard contains more than {count} sections"
            />
          ) : (
            hasModuleKindSubscription(modules) && (
              <FormattedMessage
                defaultMessage="Premium sections"
                description="webCard contains premium sections"
              />
            )
          )}
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
