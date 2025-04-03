import { memo, useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
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
import type { ListRenderItemInfo } from 'react-native';

const CardModuleSectionList = () => {
  const router = useRouter();

  const { bottom } = useScreenInsets();

  const onSelectModuleKind = useCallback(
    (variant: ModuleKindWithVariant) => {
      if (!variant) return;

      router.push({
        route: 'MODULE_PREVIEW',
        params: {
          variant,
        },
      });
    },
    [router],
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
