import FlashList from '@shopify/flash-list/dist/FlashList';
import { Image } from 'expo-image';
import { memo, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { useColorScheme, View } from 'react-native';
import { colors } from '#theme';
import ToolBoxSection from '#components/Toolbar/ToolBoxSection';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import {
  MODULE_KIND_WITH_VARIANTS,
  type ModuleKindAndVariant,
  type ModuleKindWithVariant,
  type Variant,
  type ModuleKindHasVariants,
} from '#helpers/webcardModuleHelpers';
import useBoolean from '#hooks/useBoolean';
import useModuleVariantsLabel from '#hooks/useModuleVariantsLabel';
import useScreenInsets from '#hooks/useScreenInsets';
import BottomSheetModal from '#ui/BottomSheetModal';
import Container from '#ui/Container';
import Header from '#ui/Header';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import type { ListRenderItemInfo } from '@shopify/flash-list';
import type { ColorSchemeName } from 'react-native';

type CardModuleDesignToolProps<T extends ModuleKindAndVariant> = {
  module: T;
  setVariant: (variant: Variant<T['moduleKind']>) => void;
};

const CardModuleDesignTool = <T extends ModuleKindAndVariant>({
  module,
  setVariant,
}: CardModuleDesignToolProps<T>) => {
  const intl = useIntl();
  const [show, open, close] = useBoolean(false);
  const styles = useStyleSheet(styleSheet);

  const renderItem = useCallback(
    ({
      item,
      extraData,
    }: ListRenderItemInfo<Variant<ModuleKindHasVariants>>) => {
      return (
        <DesignVariant
          module={extraData.module}
          variant={item}
          onSelectVariant={
            setVariant as (variant: Variant<ModuleKindHasVariants>) => void
          }
        />
      );
    },
    [setVariant],
  );
  const { bottom } = useScreenInsets();
  return (
    <>
      <ToolBoxSection
        label={intl.formatMessage({
          defaultMessage: 'Design',
          description: 'Card Module Design Tool - Toolbox design',
        })}
        icon="layout"
        onPress={open}
      />
      <BottomSheetModal visible={show} onDismiss={close} height={270 + bottom}>
        <Header
          middleElement={intl.formatMessage({
            defaultMessage: 'Design',
            description: 'CardModuleDesignTool - Bottom Sheet header',
          })}
          style={styles.headerStyle}
        />
        <FlashList
          data={
            MODULE_KIND_WITH_VARIANTS.find(
              ({ moduleKind }) => moduleKind === module.moduleKind,
            )?.variants ?? []
          }
          renderItem={renderItem}
          keyExtractor={item => item}
          horizontal
          estimatedItemSize={150}
          showsHorizontalScrollIndicator={false}
          contentInset={styles.scrollContentInset}
          ItemSeparatorComponent={ItemSeparator}
          extraData={{ module }}
        />
      </BottomSheetModal>
    </>
  );
};

const ItemSeparator = () => <View style={{ width: 10 }} />;

type DesignItemProps<T extends ModuleKindAndVariant> = {
  module: T;
  variant: Variant<T['moduleKind']>;
  onSelectVariant: (variant: Variant<T['moduleKind']>) => void;
};

const Item = <T extends ModuleKindAndVariant>({
  module,
  variant,
  onSelectVariant,
}: DesignItemProps<T>) => {
  const colorScheme = useColorScheme();
  const onPress = useCallback(() => {
    onSelectVariant(variant);
  }, [variant, onSelectVariant]);
  const styles = useStyleSheet(styleSheet);
  const isSelected = variant === module.variant;
  // force typing, tired of mixe conflict with typescript. spend to much time for so few intereset on this
  // open to rework if someone have a better idea
  const pictureUri = getPictureUri(
    {
      moduleKind: module.moduleKind,
      variant,
    } as ModuleKindWithVariant,
    colorScheme,
  );
  const label = useModuleVariantsLabel({
    moduleKind: module.moduleKind,
    variant,
  } as ModuleKindWithVariant);

  return (
    <PressableOpacity onPress={onPress}>
      <View
        style={[
          styles.imageContainer,
          isSelected && styles.selectedImageContainer,
        ]}
      >
        <Image source={pictureUri} style={{ flex: 1 }} />
      </View>
      <Container style={styles.badge}>
        <Text variant="smallbold">{label}</Text>
      </Container>
    </PressableOpacity>
  );
};

const DesignVariant = memo(Item);

export const getPictureUri = (
  module: ModuleKindWithVariant,
  colorScheme: ColorSchemeName,
): number | null => {
  switch (module.moduleKind) {
    case 'media':
      switch (module.variant) {
        case 'slideshow':
          return colorScheme === 'light'
            ? require('./assets/media_slideshow_light.png')
            : require('./assets/media_slideshow_dark.png');
        case 'parallax':
          return colorScheme === 'light'
            ? require('./assets/media_parallax_light.png')
            : require('./assets/media_parallax_dark.png');
        default:
          return null;
      }
    case 'mediaText':
      switch (module.variant) {
        case 'alternation':
          return colorScheme === 'light'
            ? require('./assets/media_text_alternation_light.png')
            : require('./assets/media_text_alternation_dark.png');

        case 'parallax':
          return colorScheme === 'light'
            ? require('./assets/media_text_parallax_light.png')
            : require('./assets/media_text_parallax_dark.png');
        default:
          return null;
      }
    default:
      return null;
  }
};

export default CardModuleDesignTool;

const styleSheet = createStyleSheet(appearance => ({
  imageContainer: {
    width: 148,
    height: 148,
    borderRadius: 18,
    overflow: 'hidden',
  },
  selectedImageContainer: {
    borderWidth: 2,
    borderColor: appearance === 'light' ? colors.black : colors.white,
  },
  headerStyle: { marginBottom: 15 },
  scrollContentInset: { left: 16, right: 16 },
  badge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 28,
  },
}));
