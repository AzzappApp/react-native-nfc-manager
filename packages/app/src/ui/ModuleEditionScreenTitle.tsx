import { FormattedMessage } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import PremiumIndicator from '#components/PremiumIndicator';
import Text from './Text';
import type { ModuleEditionScreenTitle_webCard$key } from '#relayArtifacts/ModuleEditionScreenTitle_webCard.graphql';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';

type ModuleEditionScreenTitleProps = {
  label: string;
  kind: ModuleKind;
  webCardKey?: ModuleEditionScreenTitle_webCard$key | null;
};
const ModuleEditionScreenTitle = (props: ModuleEditionScreenTitleProps) => {
  const { label, webCardKey } = props;

  const webCard = useFragment(
    graphql`
      fragment ModuleEditionScreenTitle_webCard on WebCard {
        isPremium
        requiresSubscription
      }
    `,
    webCardKey,
  );

  return (
    <View style={styles.container}>
      <Text variant="large">{label}</Text>
      {!webCard?.isPremium ? (
        webCard && webCard.requiresSubscription ? (
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
        ) : null
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
