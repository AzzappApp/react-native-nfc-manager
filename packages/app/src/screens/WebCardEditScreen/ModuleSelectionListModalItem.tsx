import { memo, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { Image, View, useColorScheme } from 'react-native';
import { isModuleKindSubscription } from '@azzapp/shared/subscriptionHelpers';
import { colors, shadow } from '#theme';
import PremiumIndicator from '#components/PremiumIndicator';
import { useStyleSheet, createStyleSheet } from '#helpers/createStyles';

import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';

export type ModuleSelectionListItem = {
  readonly moduleKind: ModuleKind;
  readonly label: string;
  readonly image_light: number;
  readonly image_dark: number;
  readonly ready: boolean;
  readonly isSubscriber?: boolean;
};

type ModuleSelectionListModalItemProps = {
  /**
   * the module
   *
   * @type {{ ModuleSelectionListItem}}
   */
  module: ModuleSelectionListItem;
  /**
   * the function to call when the module is selected
   *
   */
  onSelect: (moduleKind: ModuleKind) => void;
};

const ModuleSelectionListModalItem = ({
  module,
  onSelect,
}: ModuleSelectionListModalItemProps) => {
  const styles = useStyleSheet(styleSheet);
  const colorScheme = useColorScheme();

  const onPress = useCallback(() => {
    if (module.ready) {
      onSelect(module.moduleKind);
    }
  }, [module.moduleKind, module.ready, onSelect]);
  return (
    <PressableNative style={styles.root} onPress={onPress}>
      <View>
        <View style={styles.moduleContainer}>
          <Image
            style={styles.image}
            source={
              colorScheme === 'light' ? module.image_light : module.image_dark
            }
          />
        </View>
        <Text
          variant="button"
          style={{ paddingTop: 10, paddingBottom: 10 }}
          numberOfLines={1}
        >
          {module.label}
        </Text>
        <View
          style={{
            marginBottom: 18,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {module.ready ? (
            <View style={styles.freeTextView}>
              {isModuleKindSubscription(module.moduleKind) ? (
                <>
                  <Text variant="xsmall">
                    <FormattedMessage
                      defaultMessage="azzapp+"
                      description="Module Selection List - azzapp+ label for module"
                    />
                  </Text>
                  <PremiumIndicator isRequired size={18} style={styles.badge} />
                </>
              ) : (
                <Text variant="xsmall" style={{ paddingRight: 5 }}>
                  <FormattedMessage
                    defaultMessage="Free"
                    description="Module Selection List - Free label for module"
                  />
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.comingSoon}>
              <Text variant="xsmall" style={styles.comingSoonText}>
                <FormattedMessage
                  defaultMessage="Coming soon"
                  description="Module Select List - Coming soon label"
                />
              </Text>
            </View>
          )}
          <View style={styles.addIconButtonStyle}>
            <Icon icon="add" style={styles.addIconStyle} />
          </View>
        </View>
      </View>
    </PressableNative>
  );
};

export default memo(ModuleSelectionListModalItem);

const RATIO_MODULE = 0.719;

const styleSheet = createStyleSheet(appearance => ({
  root: {
    padding: 10,
    flex: 1,
    backgroundColor: appearance === 'light' ? colors.white : colors.grey900,
    borderRadius: 10,
    aspectRatio: RATIO_MODULE,
    marginHorizontal: 5,
    ...shadow(appearance, 'bottom'),
  },
  moduleContainer: {
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    borderRadius: 10,
    aspectRatio: 1,
  },
  freeTextView: {
    borderColor: appearance === 'light' ? colors.black : colors.white,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    height: 20,
    paddingLeft: 5,
    flexDirection: 'row',
  },
  addIconButtonStyle: {
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIconStyle: {
    tintColor: appearance === 'light' ? colors.white : colors.black,
  },
  image: { flex: 1, width: undefined, height: undefined },
  comingSoon: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: colors.red400,
    borderRadius: 11,
    height: 22,
  },
  comingSoonText: {
    color: colors.white,
  },
  badge: {
    marginLeft: 3,
    marginRight: 1,
  },
}));
