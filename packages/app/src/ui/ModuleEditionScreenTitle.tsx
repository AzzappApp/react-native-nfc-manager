import { FormattedMessage } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { moduleCountRequiresSubscription } from '@azzapp/shared/subscriptionHelpers';
import { colors } from '#theme';
import Icon from './Icon';
import Text from './Text';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';

type ModuleEditionScreenTitleProps = {
  label: string;
  kind: ModuleKind;
  moduleCount: number;
};
const ModuleEditionScreenTitle = (props: ModuleEditionScreenTitleProps) => {
  const { label, moduleCount } = props;

  return (
    <View style={styles.container}>
      <Text variant="large">{label}</Text>
      {moduleCountRequiresSubscription(moduleCount) && (
        <View style={styles.pro}>
          <Text variant="medium" style={styles.proText}>
            <FormattedMessage
              defaultMessage="3+ visible sections"
              description="ModuleEditionScreenTitle - label for pro section"
            />
          </Text>
          <Icon icon="plus" size={15} />
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
    marginRight: 5,
  },
});

export default ModuleEditionScreenTitle;
