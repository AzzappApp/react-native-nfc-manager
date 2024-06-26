import { fromGlobalId } from 'graphql-relay';
import { useCallback, useState } from 'react';
import { View, type ListRenderItemInfo } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { graphql, useFragment } from 'react-relay';
import useScreenInsets from '#hooks/useScreenInsets';
import CoverTemplateConfirmationScreenModal from './CoverTemplateConfirmationScreenModal';
import CoverTemplateScratchStarters from './CoverTemplateScratchStarter';
import CoverTemplateTagSelector from './CoverTemplateTagSelector';
import CoverTemplateTypePreviews from './CoverTemplateTypePreviews';
import { useCoverTemplates } from './useCoverTemplates';
import type { CoverTemplateList_profile$key } from '#relayArtifacts/CoverTemplateList_profile.graphql';
import type {
  CoverTemplatePreview,
  CoverTemplateTypeListItem,
} from './useCoverTemplates';
import type { ColorPaletteColor } from '@azzapp/shared/cardHelpers';

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
    useState<CoverTemplatePreview | null>(null);

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
          ...useCoverTemplates_coverTemplates
            @alias(as: "coverTemplatesFragment")
        }
      }
    `,
    profileKey,
  );

  const onTemplateSelect = useCallback((template: CoverTemplatePreview) => {
    setSelectedTemplate(template);
  }, []);

  const onConfirmTemplate = useCallback(() => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate.id);
      setSelectedTemplate(null);
    }
  }, [onSelectTemplate, selectedTemplate]);

  const {
    coverTemplateByType,
    refetch,
    isLoadingPrevious,
    isLoadingNext,
    loadNext,
  } = useCoverTemplates(webCard.coverTemplatesFragment);

  const onEndReached = useCallback(() => {
    if (!isLoadingNext) {
      loadNext(5);
    }
  }, [isLoadingNext, loadNext]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<CoverTemplateTypeListItem>) => {
      return (
        <CoverTemplateTypePreviews
          template={item}
          onSelect={onTemplateSelect}
        />
      );
    },
    [onTemplateSelect],
  );

  const onRefresh = useCallback(() => {
    refetch({
      after: null,
      first: 5,
      tagId: tag ? fromGlobalId(tag).id : null,
    });
  }, [refetch, tag]);

  const onSelect = useCallback(
    (tag: string | null) => {
      setTag(tag);
      //calling refecth here will not work, having the previous state
      refetch({
        after: null,
        first: 5,
        tagId: tag ? fromGlobalId(tag).id : null,
      });
    },
    [refetch],
  );
  const { bottom } = useScreenInsets();

  return (
    <View style={{ flex: 1 }}>
      <CoverTemplateTagSelector
        tagsKey={coverTemplateTags}
        selected={tag}
        onSelect={onSelect}
      />
      <View style={{ flex: 1 }}>
        <FlatList
          ListHeaderComponent={
            <CoverTemplateScratchStarters
              onColorSelect={onSelectBackgroundColor}
              cardColors={webCard?.cardColors}
            />
          }
          accessibilityRole="list"
          data={coverTemplateByType ?? []}
          keyExtractor={sectionKeyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onRefresh={onRefresh}
          refreshing={isLoadingPrevious}
          contentContainerStyle={{ paddingBottom: 40 + bottom }}
          onEndReachedThreshold={0.5}
          keyboardShouldPersistTaps="always"
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

export default CoverTemplateList;
const sectionKeyExtractor = (item: { id: string }) => {
  return item.id;
};
