import { memo } from 'react';
import { View } from 'react-native';
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
import type { ModuleEditionScreenTitle_webCard$key } from '#relayArtifacts/ModuleEditionScreenTitle_webCard.graphql';

type CardModuleHeaderProps = {
  module: ModuleKindAndVariant;
  canSave: boolean;
  save: () => void;
  webCardKey: ModuleEditionScreenTitle_webCard$key | null;
  cardModulesCount: number;
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

  return (
    <Header
      leftElement={<CancelHeaderButton onPress={back} />}
      middleElement={
        <View>
          <ModuleEditionScreenTitle
            label={title}
            kind={module.moduleKind}
            webCardKey={webCardKey}
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
