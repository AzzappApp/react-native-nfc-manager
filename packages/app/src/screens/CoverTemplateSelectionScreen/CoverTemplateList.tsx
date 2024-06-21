import { fromGlobalId } from 'graphql-relay';
import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { FlatList, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import Separation from '#ui/Separation';
import CoverTemplateConfirmationScreenModal from './CoverTemplateConfirmationScreenModal';
import CoverTemplateScratchStarters from './CoverTemplateScratchStarter';
import CoverTemplateTagSelector from './CoverTemplateTagSelector';
import { CoverTemplateTypePreviews } from './CoverTemplateTypePreviews';
import {
  useCoverTemplates,
  type CoverTemplatePreviewItem,
} from './useCoverTemplates';
import type { CoverTemplateList_profile$key } from '#relayArtifacts/CoverTemplateList_profile.graphql';
import type { ColorPaletteColor } from '@azzapp/shared/cardHelpers';
import type { ListRenderItemInfo } from 'react-native';

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
    useState<CoverTemplatePreviewItem | null>(null);

  const intl = useIntl();

  const { coverTemplateTags, coverTemplateTypes, webCard } = useFragment(
    graphql`
      fragment CoverTemplateList_profile on Profile {
        coverTemplateTags {
          ...CoverTemplateTagSelector_tags
        }
        coverTemplateTypes {
          id
          label
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

  const onTemplateSelect = useCallback((template: CoverTemplatePreviewItem) => {
    setSelectedTemplate(template);
  }, []);

  const onConfirmTemplate = useCallback(() => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate.coverTemplateId);
      setSelectedTemplate(null);
    }
  }, [onSelectTemplate, selectedTemplate]);

  const {
    templateCovers,
    refetch,
    isLoadingPrevious,
    isLoadingNext,
    loadNext,
  } = useCoverTemplates(webCard.coverTemplatesFragment);

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

      return previews.length ? (
        <CoverTemplateTypePreviews
          key={typeId}
          label={
            label ??
            intl.formatMessage({
              defaultMessage: 'Unnamed',
              description: 'CoverTemplateList - Category name - empty',
            })
          }
          previews={previews}
          onSelect={onTemplateSelect}
        />
      ) : null;
    },
    [coverTemplateTypes, intl, onTemplateSelect],
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
        onColorSelect={onSelectBackgroundColor}
        cardColors={webCard?.cardColors}
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
      <CoverTemplateConfirmationScreenModal
        template={selectedTemplate ?? null}
        onClose={() => setSelectedTemplate(null)}
        onConfirm={onConfirmTemplate}
      />
    </View>
  );
};

export default CoverTemplateList;

const keyExtractor = ([coverTemplateTypeId]: [
  string,
  CoverTemplatePreviewItem[],
]) => coverTemplateTypeId;
