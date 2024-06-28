import { FlashList } from '@shopify/flash-list';
import { fromGlobalId } from 'graphql-relay';
import { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import useScreenInsets from '#hooks/useScreenInsets';
import CoverTemplateConfirmationScreenModal from './CoverTemplateConfirmationScreenModal';
import CoverTemplateScratchStarters from './CoverTemplateScratchStarter';
import CoverTemplateTagSelector from './CoverTemplateTagSelector';
import CoverTemplateTypePreviews from './CoverTemplateTypePreviews';
import { useCoverTemplateTypes } from './useCoverTemplateTypes';
import type { CoverTemplateList_profile$key } from '#relayArtifacts/CoverTemplateList_profile.graphql';
import type { CoverTemplate } from './CoverTemplateTypePreviews';
import type { CoverTemplateType } from './useCoverTemplateTypes';
import type { ColorPaletteColor } from '@azzapp/shared/cardHelpers';
import type { ListRenderItemInfo } from '@shopify/flash-list';
import type { ViewToken } from 'react-native';

export type CoverEditorProps = {
  profile: CoverTemplateList_profile$key;
  onSelectTemplate: (templateId: string) => void;
  onSelectBackgroundColor: (color: ColorPaletteColor) => void;
};
const CoverTemplateList = ({
  profile: profileKey,
  onSelectTemplate,
  onSelectBackgroundColor,
}: CoverEditorProps) => {
  const [tag, setTag] = useState<string | null>(null);

  const [selectedTemplate, setSelectedTemplate] =
    useState<CoverTemplate | null>(null);

  const { coverTemplateTags, webCard } = useFragment(
    graphql`
      fragment CoverTemplateList_profile on Profile {
        coverTemplateTags {
          ...CoverTemplateTagSelector_tags
        }
        webCard {
          cardColors {
            light
            dark
            primary
          }
          ...useCoverTemplateTypes_coverTemplates
            @alias(as: "coverTemplatesFragment")
        }
      }
    `,
    profileKey,
  );

  const onTemplateSelect = useCallback((template: CoverTemplate) => {
    setSelectedTemplate(template);
  }, []);

  const onConfirmTemplate = useCallback(() => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate.id);
      setSelectedTemplate(null);
    }
  }, [onSelectTemplate, selectedTemplate]);

  const {
    coverTemplateTypes,
    refetch,
    isLoadingPrevious,
    isLoadingNext,
    loadNext,
  } = useCoverTemplateTypes(webCard.coverTemplatesFragment);

  const onEndReached = useCallback(() => {
    if (!isLoadingNext) {
      loadNext(5);
    }
  }, [isLoadingNext, loadNext]);

  const [viewableItems, setViewableItems] = useState<
    Array<{
      index: number;
      itemsToPlay: number;
    }>
  >([]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<CoverTemplateType>) => {
      return (
        <CoverTemplateTypePreviews
          template={item}
          onSelect={onTemplateSelect}
          videoToPlay={
            viewableItems.find(v => v.index === index)?.itemsToPlay ?? 0
          }
        />
      );
    },
    [onTemplateSelect, viewableItems],
  );

  const onRefresh = useCallback(() => {
    refetch({
      after: null,
      first: 5,
      tagId: tag ? fromGlobalId(tag).id : null,
    });
  }, [refetch, tag]);

  const onSelect = useCallback(
    (selectedTag: string | null) => {
      setTag(selectedTag);
      refetch({
        after: null,
        first: 5,
        tagId: selectedTag ? fromGlobalId(selectedTag).id : null,
      });
    },
    [refetch],
  );
  const { bottom } = useScreenInsets();

  //# region viewable to handle video preview
  const onViewableItemChanged = useCallback(
    (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      //we can only have two Item
      const viewableRows = info.viewableItems.filter(item => item.isViewable);

      // Logic to determine which videos to play
      // This is a basic implementation and might need adjustments
      if (viewableRows.length >= 2) {
        // If there are two or more viewable rows, select one video from each of the first two rows
        setViewableItems([
          { index: viewableRows[0].index!, itemsToPlay: 1 },
          { index: viewableRows[1].index!, itemsToPlay: 1 },
        ]);
      } else if (viewableRows.length === 1) {
        setViewableItems([{ index: viewableRows[0].index!, itemsToPlay: 2 }]);
      } else {
        setViewableItems([]);
      }
    },
    [],
  );

  //# endregion
  return (
    <View style={styles.container}>
      <CoverTemplateTagSelector
        tagsKey={coverTemplateTags}
        selected={tag}
        onSelect={onSelect}
      />
      <View style={{ flex: 1 }}>
        <FlashList
          ListHeaderComponent={
            <CoverTemplateScratchStarters
              onColorSelect={onSelectBackgroundColor}
              cardColors={webCard?.cardColors}
            />
          }
          accessibilityRole="list"
          data={coverTemplateTypes}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onRefresh={onRefresh}
          refreshing={isLoadingPrevious}
          contentContainerStyle={{ paddingBottom: 40 + bottom }}
          onEndReachedThreshold={0.5}
          keyboardShouldPersistTaps="always"
          onViewableItemsChanged={onViewableItemChanged}
          viewabilityConfig={viewabilityConfig}
          extraData={viewableItems}
          estimatedItemSize={298}
        />
      </View>
      <CoverTemplateConfirmationScreenModal
        template={selectedTemplate ?? null}
        onClose={() => setSelectedTemplate(null)}
        onConfirm={onConfirmTemplate}
      />
    </View>
  );
};

const viewabilityConfig = {
  //TODO: improve this with review of tester
  itemVisiblePercentThreshold: 88,
};

export default CoverTemplateList;
const keyExtractor = (item: { id: string }) => {
  return item.id;
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20 },
});
