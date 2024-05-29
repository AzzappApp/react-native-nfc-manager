import { fromGlobalId } from 'graphql-relay';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { useTemplateCover } from '#hooks/useTemplateCover';
import Separation from '#ui/Separation';
import { CoverEditorTemplateTypePreviews } from './CoverEditorTemplateTypePreviews';
import CoverTemplateScratchStarters from './CoverTemplateScratchStarter';
import CoverTemplateTagSelector from './CoverTemplateTagSelector';
import type { CoverTemplatePreviewItem } from '#hooks/useTemplateCover';
import type { CoverEditorTemplateList_profile$key } from '#relayArtifacts/CoverEditorTemplateList_profile.graphql';
import type { useTemplateCover_coverTemplates$key } from '#relayArtifacts/useTemplateCover_coverTemplates.graphql';
import type { TemplateTypePreview } from './CoverEditorTemplateTypePreviews';
import type { ListRenderItemInfo } from 'react-native';

export type CoverEditorProps = {
  profile: CoverEditorTemplateList_profile$key;
  coverTemplates: useTemplateCover_coverTemplates$key;
  onSelectCoverTemplatePreview: (preview?: TemplateTypePreview | null) => void;
};

const keyExtractor = ([coverTemplateTypeId]: [
  string,
  CoverTemplatePreviewItem[],
]) => coverTemplateTypeId;

const CoverEditorTemplateList = ({
  profile: profileKey,
  coverTemplates: coverTemplatesKey,
  onSelectCoverTemplatePreview,
}: CoverEditorProps) => {
  const [tag, setTag] = useState<string | null>(null);

  const { coverTemplateTags, coverTemplateTypes } = useFragment(
    graphql`
      fragment CoverEditorTemplateList_profile on Profile {
        coverTemplateTags {
          ...CoverTemplateTagSelector_tags
        }
        coverTemplateTypes {
          id
          label
        }
      }
    `,
    profileKey,
  );

  const {
    templateCovers,
    refetch,
    isLoadingPrevious,
    isLoadingNext,
    loadNext,
  } = useTemplateCover(coverTemplatesKey);

  const data = useMemo(() => {
    return Object.entries(templateCovers);
  }, [templateCovers]);

  const onEndReached = useCallback(() => {
    if (!isLoadingNext) {
      loadNext(2);
    }
  }, [isLoadingNext, loadNext]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<[string, CoverTemplatePreviewItem[]]>) => {
      const [typeId, previews] = item;

      const label = coverTemplateTypes.find(
        coverTemplateType => coverTemplateType.id === typeId,
      )?.label;

      return (
        <CoverEditorTemplateTypePreviews
          key={typeId}
          label={label ?? 'Label'}
          previews={previews}
          onSelect={onSelectCoverTemplatePreview}
        />
      );
    },
    [coverTemplateTypes, onSelectCoverTemplatePreview],
  );

  const onRefresh = useCallback(() => {
    refetch({
      after: null,
      first: 2,
      tagId: tag ? fromGlobalId(tag).id : null,
    });
  }, [refetch, tag]);

  const onSelect = useCallback(
    (tag: string | null) => {
      setTag(tag);
      onRefresh();
    },
    [onRefresh],
  );

  return (
    <View>
      <CoverTemplateTagSelector
        tagsKey={coverTemplateTags}
        selected={tag}
        onSelect={onSelect}
      />
      <Separation small style={{ marginTop: 10 }} />
      <CoverTemplateScratchStarters
        onSelectCoverTemplatePreview={onSelectCoverTemplatePreview}
      />
      <FlatList
        testID="cover-editor-template-list"
        accessibilityRole="list"
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.1}
        directionalLockEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        onRefresh={onRefresh}
        refreshing={isLoadingPrevious}
      />
    </View>
  );
};

export default CoverEditorTemplateList;
