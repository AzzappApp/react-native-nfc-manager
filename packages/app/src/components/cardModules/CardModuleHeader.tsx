import { memo } from 'react';
import { View } from 'react-native';
import { useFragment } from 'react-relay';
import { graphql } from 'relay-runtime';
import { colors } from '#theme';
import {
  CancelHeaderButton,
  SaveHeaderButton,
} from '#components/commonsButtons';
import { useRouter } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useVariantLabel, { useModuleLabel } from '#hooks/useModuleVariantsLabel';
import Header from '#ui/Header';
import ModuleEditionScreenTitle from '#ui/ModuleEditionScreenTitle';
import Text from '#ui/Text';
import type { ModuleKindAndVariant } from '#helpers/webcardModuleHelpers';
import type { CardModuleHeader_webCard$key } from '#relayArtifacts/CardModuleHeader_webCard.graphql';

type CardModuleHeaderProps = {
  module: ModuleKindAndVariant;
  canSave: boolean;
  save: () => void;
  webCardKey: CardModuleHeader_webCard$key | null;
};

const CardModuleHeader = ({
  module,
  canSave,
  save,
  webCardKey,
}: CardModuleHeaderProps) => {
  // #region hook
  const { back } = useRouter();
  const title = useModuleLabel(module.moduleKind);
  const variantLabel = useVariantLabel(module);
  const styles = useStyleSheet(stylesheet);
  // #endregion
  const webCard = useFragment(
    graphql`
      fragment CardModuleHeader_webCard on WebCard {
        ...ModuleEditionScreenTitle_webCard
      }
    `,
    webCardKey,
  );

  return (
    <Header
      leftElement={<CancelHeaderButton onPress={back} />}
      middleElement={
        <View>
          <ModuleEditionScreenTitle
            label={title}
            kind={module.moduleKind}
            webCardKey={webCard}
          />
          <Text variant="medium" style={styles.variantLabel}>
            {variantLabel}
          </Text>
        </View>
      }
      rightElement={<SaveHeaderButton onPress={save} disabled={!canSave} />}
    />
  );
};

const stylesheet = createStyleSheet(appearance => ({
  variantLabel: {
    color: appearance === 'light' ? colors.grey200 : colors.grey800,
    textAlign: 'center',
  },
}));

export default memo(CardModuleHeader);
