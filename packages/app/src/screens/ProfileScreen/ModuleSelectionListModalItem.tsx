import { memo, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { Image, View, useColorScheme } from 'react-native';
import { colors, shadow } from '#theme';
import { useStyleSheet, createStyleSheet } from '#helpers/createStyles';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';

export type ModuleSelectionListItem = {
  readonly moduleKind: ModuleKind;
  readonly label: string;
  readonly image_light: number;
  readonly image_dark: number;
  readonly ready: boolean;
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
    <View style={styles.root}>
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
        adjustsFontSizeToFit
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
        <View style={styles.freeTextView}>
          <Text variant="xsmall">
            <FormattedMessage
              defaultMessage="Free"
              description="Module Selection List - Free label for module"
            />
          </Text>
        </View>
        <IconButton
          icon="add"
          iconSize={16}
          size={26}
          variant="icon"
          style={styles.addIconButtonStyle}
          iconStyle={styles.addIconStyle}
          onPress={onPress}
        />
      </View>
    </View>
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
    paddingRight: 5,
  },
  addIconButtonStyle: {
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
  },
  addIconStyle: {
    tintColor: appearance === 'light' ? colors.white : colors.black,
  },
  image: { flex: 1, width: undefined, height: undefined },
}));
