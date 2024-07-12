import { FormattedMessage } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { moduleCountRequiresSubscription } from '@azzapp/shared/subscriptionHelpers';
import { colors } from '#theme';
import PremiumIndicator from '#components/PremiumIndicator';
import Text from './Text';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';

type ModuleEditionScreenTitleProps = {
  label: string;
  kind: ModuleKind;
  moduleCount: number;
  requiresSubscription?: boolean;
  isPremium?: boolean;
};
const ModuleEditionScreenTitle = (props: ModuleEditionScreenTitleProps) => {
  const {
    label,
    moduleCount,
    requiresSubscription = false,
    isPremium = false,
  } = props;

  return (
    <View style={styles.container}>
      <Text variant="large">{label}</Text>
      {!isPremium &&
        (moduleCountRequiresSubscription(moduleCount) ||
          requiresSubscription) && (
          <View style={styles.pro}>
            <Text variant="medium" style={styles.proText}>
              <FormattedMessage
                defaultMessage="azzapp+ WebCard"
                description="ModuleEditionScreenTitle - label for pro section"
              />
            </Text>
            <PremiumIndicator isRequired />
          </View>
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    alignItems: 'center',
  },
  pro: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  proText: {
    color: colors.grey400,
  },
});

export default ModuleEditionScreenTitle;
