import { FormattedMessage } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import {
  isModuleKindSubscription,
  MODULE_COUNT_LIMIT_FOR_SUBSCRIPTION,
  moduleCountRequiresSubscription,
} from '@azzapp/shared/subscriptionHelpers';
import { colors } from '#theme';
import PremiumIndicator from '#components/PremiumIndicator';
import Text from './Text';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';

type ModuleEditionScreenTitleProps = {
  label: string;
  kind: ModuleKind;
  moduleCount: number;
  isPremium?: boolean;
};
const ModuleEditionScreenTitle = (props: ModuleEditionScreenTitleProps) => {
  const { label, moduleCount, kind, isPremium = false } = props;

  const requiresSubscription = isModuleKindSubscription(kind);

  return (
    <View style={styles.container}>
      <Text variant="large">{label}</Text>
      {!isPremium ? (
        moduleCountRequiresSubscription(moduleCount) ? (
          <FormattedMessage
            defaultMessage="{count}+ sections"
            values={{
              count: MODULE_COUNT_LIMIT_FOR_SUBSCRIPTION,
            }}
            description="ModuleEditionScreenTitle - label when module count requires subscription"
          />
        ) : (
          requiresSubscription && (
            <View style={styles.pro}>
              <Text variant="medium" style={styles.proText}>
                <FormattedMessage
                  defaultMessage="azzapp+ section"
                  description="ModuleEditionScreenTitle - label for premium section"
                />
              </Text>
              <PremiumIndicator isRequired />
            </View>
          )
        )
      ) : null}
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
