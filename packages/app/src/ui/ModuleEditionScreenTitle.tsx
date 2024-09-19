import { FormattedMessage } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import {
  isModuleKindSubscription,
  isWebCardKindSubscription,
  MODULE_COUNT_LIMIT_FOR_SUBSCRIPTION,
  moduleCountRequiresSubscription,
} from '@azzapp/shared/subscriptionHelpers';
import { colors } from '#theme';
import PremiumIndicator from '#components/PremiumIndicator';
import Text from './Text';
import type { ModuleEditionScreenTitle_webCard$key } from '#relayArtifacts/ModuleEditionScreenTitle_webCard.graphql';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';

type ModuleEditionScreenTitleProps = {
  label: string;
  kind: ModuleKind;
  moduleCount: number;
  webCardKey: ModuleEditionScreenTitle_webCard$key | null;
};
const ModuleEditionScreenTitle = (props: ModuleEditionScreenTitleProps) => {
  const { label, moduleCount, kind, webCardKey } = props;

  const requiresSubscription = isModuleKindSubscription(kind);

  const webCard = useFragment(
    graphql`
      fragment ModuleEditionScreenTitle_webCard on WebCard {
        id
        isPremium
        webCardKind
      }
    `,
    webCardKey,
  );

  return (
    <View style={styles.container}>
      <Text variant="large">{label}</Text>
      {!webCard?.isPremium ? (
        webCard && isWebCardKindSubscription(webCard.webCardKind) ? (
          <View style={styles.pro}>
            <Text variant="medium" style={styles.proText}>
              <FormattedMessage
                defaultMessage="azzapp+ WebCard{azzappA}"
                values={{
                  azzappA: <Text variant="azzapp">a</Text>,
                }}
                description="ModuleEditionScreenTitle - webCard is premium"
              />
            </Text>
            <PremiumIndicator isRequired />
          </View>
        ) : moduleCountRequiresSubscription(moduleCount) ? (
          <View style={styles.pro}>
            <Text variant="medium" style={styles.proText}>
              <FormattedMessage
                defaultMessage="{count}+ sections"
                values={{
                  count: MODULE_COUNT_LIMIT_FOR_SUBSCRIPTION,
                }}
                description="ModuleEditionScreenTitle - label when module count requires subscription"
              />
            </Text>
            <PremiumIndicator isRequired />
          </View>
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
