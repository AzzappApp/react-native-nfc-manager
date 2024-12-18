import { FlashList } from '@shopify/flash-list';
import { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import useScreenInsets from '#hooks/useScreenInsets';
import ActivityIndicator from '#ui/ActivityIndicator';
import CoverTemplateConfirmationScreenModal from './CoverTemplateConfirmationScreenModal';
import CoverTemplateTypePreviews, {
  CoverTemplateTypePreviewFallback,
} from './CoverTemplateTypePreviews';
import { useCoverTemplateTypes } from './useCoverTemplateTypes';
import type { CoverTemplateList_profile$key } from '#relayArtifacts/CoverTemplateList_profile.graphql';
import type { CoverTemplate } from './CoverTemplateTypePreviews';
import type { CoverTemplateType } from './useCoverTemplateTypes';
import type { ColorPaletteColor } from '@azzapp/shared/cardHelpers';
import type { ListRenderItemInfo } from '@shopify/flash-list';
import type { ReactElement } from 'react';
import type { ViewToken } from 'react-native';

export type CoverEditorProps = {
  profile: CoverTemplateList_profile$key;
  tag: string | null;
  onSelectTemplate: (templateId: string, color?: ColorPaletteColor) => void;
  ListFooterComponent?: ReactElement;
};

const CoverTemplateList = ({
  profile: profileKey,
  tag,
  onSelectTemplate,
  ListFooterComponent,
}: CoverEditorProps) => {
  const [selectedTemplate, setSelectedTemplate] =
    useState<CoverTemplate | null>(null);

  const { webCard } = useFragment(
    graphql`
      fragment CoverTemplateList_profile on Profile
      @argumentDefinitions(tagId: { type: ID, defaultValue: null }) {
        webCard {
          cardColors {
            light
            dark
            primary
          }
          ...useCoverTemplateTypes_coverTemplates
            @alias(as: "coverTemplatesFragment")
            @arguments(tagId: $tagId)
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
      onSelectTemplate(
        selectedTemplate.id,
        (selectedTemplate.backgroundColor as ColorPaletteColor) ?? undefined,
      );
      setSelectedTemplate(null);
    }
  }, [onSelectTemplate, selectedTemplate]);

  const {
    coverTemplateTypes,
    refetch,
    isLoadingPrevious,
    isLoadingNext,
    hasNext,
    loadNext,
  } = useCoverTemplateTypes(webCard?.coverTemplatesFragment ?? null);

  const onEndReached = useCallback(() => {
    if (!isLoadingNext && hasNext) {
      loadNext(5);
    }
  }, [isLoadingNext, hasNext, loadNext]);

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
    refetch(
      {
        after: null,
        first: 5,
        tagId: tag,
      },
      {
        fetchPolicy: 'store-and-network',
      },
    );
  }, [refetch, tag]);

  const { bottom } = useScreenInsets();

  //# region viewable to handle video preview
  const onViewableItemChanged = useCallback(
    (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      //we can only have two Item
      const viewableRows = info.viewableItems.filter(item => item.isViewable);

      // Logic to determine which videos to play
      // This is a basic implementation and might need adjustments
      if (viewableRows.length >= 1) {
        setViewableItems([{ index: viewableRows[0].index!, itemsToPlay: 2 }]);
      } else {
        setViewableItems([]);
      }
    },
    [],
  );

  //# endregion

  const extraData = useMemo(
    () => ({
      viewableItems,
      hasNext,
    }),
    [viewableItems, hasNext],
  );

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <FlashList
          key={tag}
          ListFooterComponent={
            <>
              {hasNext ? null : ListFooterComponent}
              {isLoadingNext ? (
                <View style={styles.activityIndicatorContainer}>
                  <ActivityIndicator />
                </View>
              ) : null}
            </>
          }
          accessibilityRole="list"
          data={coverTemplateTypes}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onRefresh={onRefresh}
          refreshing={isLoadingPrevious}
          contentContainerStyle={{ paddingBottom: bottom }}
          onEndReachedThreshold={0.5}
          keyboardShouldPersistTaps="always"
          onViewableItemsChanged={onViewableItemChanged}
          viewabilityConfig={viewabilityConfig}
          extraData={extraData}
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

export const CoverTemplateListFallback = ({
  ListFooterComponent,
}: {
  ListFooterComponent?: ReactElement;
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: 5 }).map((_, index) => (
        <CoverTemplateTypePreviewFallback key={index} />
      ))}
      {ListFooterComponent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  activityIndicatorContainer: {
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
