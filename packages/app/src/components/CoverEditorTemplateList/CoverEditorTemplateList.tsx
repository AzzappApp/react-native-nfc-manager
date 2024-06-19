import { fromGlobalId } from 'graphql-relay';
import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { FlatList, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import Separation from '#ui/Separation';
import CoverEditorTemplateConfirmationScreenModal from './CoverEditorTemplateConfirmationScreenModal';
import { CoverEditorTemplateTypePreviews } from './CoverEditorTemplateTypePreviews';
import CoverTemplateScratchStarters from './CoverTemplateScratchStarter';
import CoverTemplateTagSelector from './CoverTemplateTagSelector';
import {
  useCoverTemplates,
  type CoverTemplatePreviewItem,
} from './useCoverTemplates';
import type { CoverEditorTemplateList_profile$key } from '#relayArtifacts/CoverEditorTemplateList_profile.graphql';
import type { TemplateTypePreview } from './CoverEditorTemplateTypePreviews';
import type { ColorPaletteColor } from '@azzapp/shared/cardHelpers';
import type { ListRenderItemInfo } from 'react-native';

export type CoverEditorProps = {
  profile: CoverEditorTemplateList_profile$key;
  onSelectCoverTemplatePreview: (args: {
    template: TemplateTypePreview | null;
    backgroundColor: ColorPaletteColor | null;
  }) => void;
};

const keyExtractor = ([coverTemplateTypeId]: [
  string,
  CoverTemplatePreviewItem[],
]) => coverTemplateTypeId;

const CoverEditorTemplateList = ({
  profile: profileKey,
  onSelectCoverTemplatePreview,
}: CoverEditorProps) => {
  const [tag, setTag] = useState<string | null>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<{
    template: TemplateTypePreview;
    backgroundColor: ColorPaletteColor | null;
  } | null>(null);

  const intl = useIntl();

  const {
    coverTemplateTags,
    coverTemplateTypes,
    webCard,
    coverTemplatesFragment,
  } = useFragment(
    graphql`
      fragment CoverEditorTemplateList_profile on Profile {
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
        }
        ...useCoverTemplates_coverTemplates @alias(as: "coverTemplatesFragment")
      }
    `,
    profileKey,
  );

  const onColorSelect = useCallback(
    (color: ColorPaletteColor) => {
      setSelectedTemplate(null);
      onSelectCoverTemplatePreview({
        template: null,
        backgroundColor: color,
      });
    },
    [onSelectCoverTemplatePreview],
  );

  const onTemplateSelect = useCallback(
    (template: TemplateTypePreview) => {
      setSelectedTemplate({ template, backgroundColor: null });
    },
    [setSelectedTemplate],
  );

  const {
    templateCovers,
    refetch,
    isLoadingPrevious,
    isLoadingNext,
    loadNext,
  } = useCoverTemplates(coverTemplatesFragment);

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
        <CoverEditorTemplateTypePreviews
          key={typeId}
          label={
            label ??
            intl.formatMessage({
              defaultMessage: 'Unnamed',
              description: 'CoverEditorTemplateList - Category name - empty',
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
        onColorSelect={onColorSelect}
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
      <CoverEditorTemplateConfirmationScreenModal
        template={selectedTemplate?.template ?? null}
        onClose={() => setSelectedTemplate(null)}
        onConfirm={() => onSelectCoverTemplatePreview(selectedTemplate!)}
      />
    </View>
  );
};

export default CoverEditorTemplateList;
