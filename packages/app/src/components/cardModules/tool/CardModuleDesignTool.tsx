import { Image } from 'expo-image';
import { memo, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useColorScheme, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { colors } from '#theme';
import { DoneHeaderButton } from '#components/commonsButtons';
import ToolBoxSection from '#components/Toolbar/ToolBoxSection';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import {
  MODULE_KIND_WITH_VARIANTS,
  type ModuleKindAndVariant,
  type ModuleKindWithVariant,
  type Variant,
  type ModuleKindHasVariants,
  isModuleVariantSupported,
} from '#helpers/webcardModuleHelpers';
import useBoolean from '#hooks/useBoolean';
import useModuleVariantsLabel from '#hooks/useModuleVariantsLabel';
import useScreenInsets from '#hooks/useScreenInsets';
import BottomSheetModal from '#ui/BottomSheetModal';
import Container from '#ui/Container';
import Header from '#ui/Header';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import type { ColorSchemeName, ListRenderItemInfo } from 'react-native';

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
    ({ item }: ListRenderItemInfo<T['variant']>) => {
      return (
        <DesignVariant
          module={module}
          variant={item}
          onSelectVariant={
            setVariant as (variant: Variant<ModuleKindHasVariants>) => void
          }
        />
      );
    },
    [module, setVariant],
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
          rightElement={<DoneHeaderButton onPress={close} />}
          style={styles.headerStyle}
        />
        <FlatList
          data={
            MODULE_KIND_WITH_VARIANTS.find(
              ({ moduleKind }) => moduleKind === module.moduleKind,
            )?.variants ?? []
          }
          renderItem={renderItem}
          keyExtractor={item => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentInset}
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
  const isVariantSupported = isModuleVariantSupported(module);

  return (
    <PressableOpacity
      onPress={onPress}
      disabled={!isVariantSupported}
      disabledOpacity={1}
    >
      <View
        style={[
          styles.imageContainer,
          isSelected && styles.selectedImageContainer,
        ]}
      >
        <Image source={pictureUri} style={styles.image} />
      </View>
      {!isVariantSupported && (
        <Container style={styles.comingSoon}>
          <Text
            variant="xsmallbold"
            appearance="dark"
            style={styles.comingSoonText}
          >
            <FormattedMessage
              defaultMessage="Coming soon"
              description="Module is not available yet"
            />
          </Text>
        </Container>
      )}
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
        case 'full_grid':
          return colorScheme === 'light'
            ? require('./assets/media_full_grid_light.png')
            : require('./assets/media_full_grid_dark.png');
        case 'full_slideshow':
          return colorScheme === 'light'
            ? require('./assets/media_full_slideshow_light.png')
            : require('./assets/media_full_slideshow_dark.png');
        case 'fullscreen':
          return colorScheme === 'light'
            ? require('./assets/media_fullscreen_light.png')
            : require('./assets/media_fullscreen_dark.png');
        case 'grid':
          return colorScheme === 'light'
            ? require('./assets/media_grid_light.png')
            : require('./assets/media_grid_dark.png');
        case 'original':
          return colorScheme === 'light'
            ? require('./assets/media_original_light.png')
            : require('./assets/media_original_dark.png');
        case 'original_slideshow':
          return colorScheme === 'light'
            ? require('./assets/media_original_slideshow_light.png')
            : require('./assets/media_original_slideshow_dark.png');
        case 'zoom_out_fade':
          return colorScheme === 'light'
            ? require('./assets/media_zoom_out_fade_light.png')
            : require('./assets/media_zoom_out_fade_dark.png');
        default:
          return null;
      }
    case 'mediaText':
      switch (module.variant) {
        case 'alternation':
          return colorScheme === 'light'
            ? require('./assets/Media_Text/media_with_text_light_grey_Alternation.png')
            : require('./assets/Media_Text/media_with_text_dark_grey_Alternation.png');
        case 'parallax':
          return colorScheme === 'light'
            ? require('./assets/Media_Text/media_with_text_light_grey_Parallax.png')
            : require('./assets/Media_Text/media_with_text_dark_grey_Parallax.png');
        case 'full_alternation':
          return colorScheme === 'light'
            ? require('./assets/Media_Text/media_with_text_light_grey_Full_Alternation.png')
            : require('./assets/Media_Text/media_with_text_dark_grey_Full_Alternation.png');
        case 'article':
          return colorScheme === 'light'
            ? require('./assets/Media_Text/media_with_text_light_grey_Articles.png')
            : require('./assets/Media_Text/media_with_text_dark_grey_Articles.png');
        case 'card':
          return colorScheme === 'light'
            ? require('./assets/Media_Text/media_with_text_light_grey_Cards.png')
            : require('./assets/Media_Text/media_with_text_dark_grey_Cards.png');
        case 'card_gradient':
          return colorScheme === 'light'
            ? require('./assets/Media_Text/media_with_text_light_grey_Cards_gradient.png')
            : require('./assets/Media_Text/media_with_text_dark_grey_Cards_gradient.png');
        case 'grid':
          return colorScheme === 'light'
            ? require('./assets/Media_Text/media_with_text_light_grey_Grid.png')
            : require('./assets/Media_Text/media_with_text_dark_grey_Grid.png');
        case 'superposition':
          return colorScheme === 'light'
            ? require('./assets/Media_Text/media_with_text_light_grey_Superposition.png')
            : require('./assets/Media_Text/media_with_text_dark_grey_Superposition.png');
        default:
          return null;
      }
    case 'mediaTextLink':
      switch (module.variant) {
        case 'alternation':
          return colorScheme === 'light'
            ? require('./assets/Media_Text_Link/media_with_text_and_link_light_grey_Alternation.png')
            : require('./assets/Media_Text_Link/media_with_text_and_link_dark_grey_Alternation.png');
        case 'parallax':
          return colorScheme === 'light'
            ? require('./assets/Media_Text_Link/media_with_text_and_link_light_grey_Parallax.png')
            : require('./assets/Media_Text_Link/media_with_text_and_link_dark_grey_Parallax.png');
        case 'full_alternation':
          return colorScheme === 'light'
            ? require('./assets/Media_Text_Link/media_with_text_and_link_light_grey_Full_Alternation.png')
            : require('./assets/Media_Text_Link/media_with_text_and_link_dark_grey_Full_Alternation.png');
        case 'article':
          return colorScheme === 'light'
            ? require('./assets/Media_Text_Link/media_with_text_and_link_light_grey_Articles.png')
            : require('./assets/Media_Text_Link/media_with_text_and_link_dark_grey_Articles.png');
        case 'card':
          return colorScheme === 'light'
            ? require('./assets/Media_Text_Link/media_with_text_and_link_light_grey_Cards.png')
            : require('./assets/Media_Text_Link/media_with_text_and_link_dark_grey_Cards.png');
        case 'card_gradient':
          return colorScheme === 'light'
            ? require('./assets/Media_Text_Link/media_with_text_and_link_light_grey_Cards_gradient.png')
            : require('./assets/Media_Text_Link/media_with_text_and_link_dark_grey_Cards_gradient.png');
        case 'grid':
          return colorScheme === 'light'
            ? require('./assets/Media_Text_Link/media_with_text_and_link_light_grey_Grid.png')
            : require('./assets/Media_Text_Link/media_with_text_and_link_dark_grey_Grid.png');
        case 'button_round':
          return colorScheme === 'light'
            ? require('./assets/Media_Text_Link/media_with_text_and_link_light_grey_Buttons_round.png')
            : require('./assets/Media_Text_Link/media_with_text_and_link_dark_grey_Buttons_round.png');
        case 'button_square':
          return colorScheme === 'light'
            ? require('./assets/Media_Text_Link/media_with_text_and_link_light_grey_Buttons_square.png')
            : require('./assets/Media_Text_Link/media_with_text_and_link_dark_grey_Buttons_square.png');
        case 'list':
          return colorScheme === 'light'
            ? require('./assets/Media_Text_Link/media_with_text_and_link_light_grey_List.png')
            : require('./assets/Media_Text_Link/media_with_text_and_link_dark_grey_List.png');
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
    borderWidth: 1,
    borderColor: appearance === 'light' ? colors.grey50 : 'transparent',
  },
  selectedImageContainer: {
    borderWidth: 2,
    borderColor: appearance === 'light' ? colors.black : colors.white,
  },
  headerStyle: { marginBottom: 15 },
  scrollContentInset: { paddingHorizontal: 16, height: 150 },
  badge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 28,
  },
  image: { flex: 1 },
  comingSoon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  comingSoonText: {
    backgroundColor: colors.black,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 28,
  },
}));
