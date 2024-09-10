import { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from '#components/NativeRouter';
import useModules from '#hooks/useModules';
import useScreenInsets from '#hooks/useScreenInsets';
import ModuleSelectionListModalItem from './ModuleSelectionListModalItem';
import type { ModuleSelectionListItem } from './ModuleSelectionListModalItem';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';
import type { ListRenderItemInfo } from 'react-native';

const AddContentBelowCoverSections = () => {
  const { bottom } = useScreenInsets();
  const router = useRouter();

  const onSelectModuleKind = useCallback(
    (module: ModuleKind) => {
      router.push({
        route: 'CARD_MODULE_EDITION',
        params: { module, isNew: true },
      });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ModuleSelectionListItem | null>) =>
      item ? (
        <ModuleSelectionListModalItem
          module={item}
          key={item.moduleKind}
          onSelect={onSelectModuleKind}
        />
      ) : (
        <View
          key="empty"
          style={{
            flex: 1,
            padding: 15,
          }}
        />
      ),

    [onSelectModuleKind],
  );

  const modules = useModules();
  return (
    <FlatList
      numColumns={2}
      data={modules}
      renderItem={renderItem}
      contentContainerStyle={{
        rowGap: 10,
        columnGap: 10,
        paddingBottom: bottom + 30,
      }}
      style={styles.flatList}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  flatList: {
    paddingHorizontal: 10,
    paddingTop: 20,
  },
});

export default AddContentBelowCoverSections;
