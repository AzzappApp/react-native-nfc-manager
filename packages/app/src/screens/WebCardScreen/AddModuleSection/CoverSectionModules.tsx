import { Image } from 'expo-image';
import { memo, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { FlatList, StyleSheet } from 'react-native';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import { getRouteForCardModule } from '#helpers/cardModuleRouterHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useModuleVariantsLabel from '#hooks/useModuleVariantsLabel';
import useModuleVariantsPreviewImage from '#hooks/useModuleVariantsPreviewImage';
import Container from '#ui/Container';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import type {
  ModuleKindWithVariant,
  ModuleKindSection,
} from '#helpers/webcardModuleHelpers';
import type { ListRenderItemInfo } from 'react-native';

type CoverSectionModules = {
  section: ModuleKindSection;
  closeModuleList: () => void;
  addingModuleRequiresSubscription: boolean;
};

const CoverSectionModules = ({
  section,
  closeModuleList,
  addingModuleRequiresSubscription,
}: CoverSectionModules) => {
  const styles = useStyleSheet(stylesheet);
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<string>) => {
      const props = (
        section.section === 'custom'
          ? { moduleKind: item }
          : {
              moduleKind: section.section,
              variant: item,
            }
      ) as ModuleKindWithVariant;
      return (
        <VariantItem
          {...props}
          closeModuleList={closeModuleList}
          addingModuleRequiresSubscription={addingModuleRequiresSubscription}
        />
      );
    },
    [addingModuleRequiresSubscription, closeModuleList, section.section],
  );

  return (
    <FlatList
      data={
        section.section === 'custom' ? section.moduleKind : section.variants
      }
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={{
        rowGap: 10,
        columnGap: 10,
        paddingHorizontal: 10,
      }}
      style={styles.flatList}
      showsHorizontalScrollIndicator={false}
      horizontal
    />
  );
};

const keyExtractor = (item: string) => item;

const stylesheet = createStyleSheet(appearance => ({
  flatList: {
    paddingTop: 20,
  },
  module: {
    width: 150,
    height: 150,
    backgroundColor: colors.grey50,
    borderRadius: 18,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appearance === 'light' ? colors.grey100 : colors.grey800,
  },
  badge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 28,
  },
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
  image: { flex: 1 },
}));

export default CoverSectionModules;

const Item = ({
  closeModuleList,
  addingModuleRequiresSubscription,
  ...props
}: ModuleKindWithVariant & {
  closeModuleList: () => void;
  addingModuleRequiresSubscription: boolean;
}) => {
  const router = useRouter();
  const styles = useStyleSheet(stylesheet);

  const route = getRouteForCardModule({ ...props, isNew: true });

  const onSelectModuleKind = useCallback(() => {
    if (route) {
      if (addingModuleRequiresSubscription) {
        router.push({ route: 'USER_PAY_WALL' });
        return;
      }

      router.push(route);
      closeModuleList();
    }
  }, [addingModuleRequiresSubscription, closeModuleList, route, router]);

  const uri = useModuleVariantsPreviewImage(props);
  const label = useModuleVariantsLabel(props);

  return (
    <PressableOpacity
      onPress={onSelectModuleKind}
      style={styles.module}
      disabled={!route}
      disabledOpacity={1}
    >
      <Image source={uri} style={styles.image} />
      {!route && (
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

const VariantItem = memo(Item);
