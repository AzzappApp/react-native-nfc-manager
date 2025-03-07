import { memo, useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { moduleCountRequiresSubscription } from '@azzapp/shared/subscriptionHelpers';
import { useRouter } from '#components/NativeRouter';
import { MODULE_VARIANT_SECTION } from '#helpers/webcardModuleHelpers';
import { useModuleLabel } from '#hooks/useModuleVariantsLabel';
import useScreenInsets from '#hooks/useScreenInsets';
import Text from '#ui/Text';
import CoverSectionModules from './CoverSectionModules';
import type {
  ModuleKindSection,
  ModuleKindWithVariant,
} from '#helpers/webcardModuleHelpers';
import type { CardModuleSectionList_webCard$key } from '#relayArtifacts/CardModuleSectionList_webCard.graphql';
import type { ListRenderItemInfo } from 'react-native';

type CardModuleSectionListProps = {
  webCardKey: CardModuleSectionList_webCard$key;
};

const CardModuleSectionList = ({ webCardKey }: CardModuleSectionListProps) => {
  const router = useRouter();

  const webCard = useFragment(
    graphql`
      fragment CardModuleSectionList_webCard on WebCard {
        isPremium
        cardIsPublished
        userName
        cardModules {
          id
        }
      }
    `,
    webCardKey,
  );

  const { bottom } = useScreenInsets();

  const onSelectModuleKind = useCallback(
    (variant: ModuleKindWithVariant) => {
      const cardModulesCount = webCard.cardModules?.length;
      const addingModuleRequiresSubscription =
        moduleCountRequiresSubscription(cardModulesCount + 1) &&
        webCard.cardIsPublished &&
        !webCard.isPremium;

      if (!variant) return;

      router.push({
        route: 'MODULE_PREVIEW',
        params: {
          variant,
          requireSubscription: addingModuleRequiresSubscription,
        },
      });
    },
    [
      router,
      webCard.cardIsPublished,
      webCard.cardModules?.length,
      webCard.isPremium,
    ],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ModuleKindSection>) => {
      return (
        <SectionModules item={item} onSelectModuleKind={onSelectModuleKind} />
      );
    },
    [onSelectModuleKind],
  );

  return (
    <FlatList
      data={MODULE_VARIANT_SECTION}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: bottom + 30 },
      ]}
      style={styles.flatList}
      showsVerticalScrollIndicator={false}
    />
  );
};

const keyExtractor = (item: ModuleKindSection, index: number) =>
  `${item.section}_${index}`;

export default CardModuleSectionList;

type SectionModulesProps = {
  item: ModuleKindSection;
  onSelectModuleKind: (variant: ModuleKindWithVariant) => void;
};

const Item = ({ item, onSelectModuleKind }: SectionModulesProps) => {
  const label = useModuleLabel(item.section);
  return (
    <View>
      <Text style={styles.textItem} variant="large">
        {label}
      </Text>
      <CoverSectionModules
        section={item}
        onSelectModuleKind={onSelectModuleKind}
      />
    </View>
  );
};

const SectionModules = memo(Item);

const styles = StyleSheet.create({
  contentContainer: {
    rowGap: 10,
    columnGap: 10,
  },
  textItem: { marginHorizontal: 10 },
  flatList: { paddingTop: 20 },
});
