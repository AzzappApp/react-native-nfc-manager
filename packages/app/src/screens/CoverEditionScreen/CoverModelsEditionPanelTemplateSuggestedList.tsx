import { memo, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { View, StyleSheet, FlatList, Image } from 'react-native';
import { useFragment, graphql } from 'react-relay';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors, shadow } from '#theme';
import { MediaImageRenderer } from '#components/medias';
import { useStyleSheet, createStyleSheet } from '#helpers/createStyles';
import Container from '#ui/Container';
import PressableNative from '#ui/PressableNative';
import TitleWithLine from '#ui/TitleWithLine';
import { TEMPLATE_BORDER_WIDTH, TEMPLATE_GAP } from './coverEditionConstants';

import CoverTextPreview from './CoverTextPreview';
import type {
  CoverModelsEditionPanelTemplateSuggestedList_suggestion$data,
  CoverModelsEditionPanelTemplateSuggestedList_suggestion$key,
} from '@azzapp/relay/artifacts/CoverModelsEditionPanelTemplateSuggestedList_suggestion.graphql';
import type { CoverModelsEditionPanelTemplateSuggestedListItem_template$key } from '@azzapp/relay/artifacts/CoverModelsEditionPanelTemplateSuggestedListItem_template.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ListRenderItemInfo } from 'react-native';

type Suggestion = ArrayItemType<
  CoverModelsEditionPanelTemplateSuggestedList_suggestion$data['coverTemplatesSuggestion']
>;

type CoverModelsEditionPanelTemplateListProps = {
  viewer: CoverModelsEditionPanelTemplateSuggestedList_suggestion$key;
  /**
   * height of flatlist row
   *
   * @type {number}
   */
  rowHeight: number;
  /**
   * cover width
   *
   * @type {number}
   */
  coverWidth: number;
  /**
   * cover height
   *
   * @type {number}
   */
  coverHeight: number;
  /**
   * profile title
   *
   * @type {(string | null)}
   */
  title?: string | null;
  /**
   * profile subtitle
   *
   * @type {(string | null)}
   */
  subTitle?: string | null;
  /**
   * the selected template id
  /**
   *
   *
   * @type {(string | null)}
   */
  selectedTemplateId: string | null;
  /**
   * callback when selecting a template
   * **/
  onSelectTemplate: (templateId: string) => void;
};

const CoverModelsEditionPanelTemplateSuggestedList = ({
  viewer,
  coverWidth,
  coverHeight,
  title,
  subTitle,
  selectedTemplateId,
  onSelectTemplate,
  rowHeight,
}: CoverModelsEditionPanelTemplateListProps) => {
  const { coverTemplatesSuggestion, profile } = useFragment(
    graphql`
      fragment CoverModelsEditionPanelTemplateSuggestedList_suggestion on Viewer {
        profile {
          companyActivity {
            id
            label
          }
        }
        coverTemplatesSuggestion {
          id
          ...CoverModelsEditionPanelTemplateSuggestedListItem_template
        }
      }
    `,
    viewer,
  );

  const templateItemWidth = coverWidth + 2 * TEMPLATE_BORDER_WIDTH - 0.5;
  const templateItemHeight = coverHeight + 2 * TEMPLATE_BORDER_WIDTH;

  const renderTemplate = useCallback(
    ({ item }: ListRenderItemInfo<Suggestion>) => {
      if (item) {
        return (
          <TemplateSuggestionMemo
            item={item}
            coverWidth={coverWidth}
            coverHeight={coverHeight}
            isSelected={selectedTemplateId === item.id}
            onSelectTemplate={onSelectTemplate}
            title={title}
            subTitle={subTitle}
            templateItemWidth={templateItemWidth}
            templateItemHeight={templateItemHeight}
          />
        );
      }
      return null;
    },
    [
      coverHeight,
      coverWidth,
      onSelectTemplate,
      selectedTemplateId,
      subTitle,
      templateItemHeight,
      templateItemWidth,
      title,
    ],
  );

  const getItemLayoutTemplate = useCallback(
    (_: any, index: number) => ({
      length: templateItemWidth,
      offset: 20 + (templateItemWidth + TEMPLATE_GAP) * index,
      index,
    }),
    [templateItemWidth],
  );

  return (
    <View style={{ height: rowHeight }}>
      <TitleWithLine title={profile?.companyActivity?.label ?? ''} />
      <FlatList
        data={coverTemplatesSuggestion}
        renderItem={renderTemplate}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractorTemplates}
        getItemLayout={getItemLayoutTemplate}
        style={styles.templateList}
        contentContainerStyle={styles.templateListContainer}
      />
    </View>
  );
};

export default memo(CoverModelsEditionPanelTemplateSuggestedList);
const styles = StyleSheet.create({
  templateList: {
    overflow: 'visible',
  },
  templateListContainer: {
    columnGap: TEMPLATE_GAP,
    paddingHorizontal: 20,
  },
});

const keyExtractorTemplates = (item: Suggestion, index: number) =>
  item?.id ?? `templates-${index}`;

type CoverModelsEditionPanelTemplateSuggestionItem = {
  item: CoverModelsEditionPanelTemplateSuggestedListItem_template$key;
  /**
   * width of the cover
   *
   * @type {number}
   */
  coverWidth: number;
  /**
   * height of the cover
   *
   * @type {number}
   */
  coverHeight: number;
  /**
   * true if the item is selected
   *
   * @type {boolean}
   */
  isSelected: boolean;
  /**
   * the Title of the cover
   *
   * @type {(string | null)}
   */
  title?: string | null;
  /**
   * the SubTitle of the cover
   *
   * @type {(string | null)}
   */
  subTitle?: string | null;
  /**
   * callback when selecting a template
   *
   */
  onSelectTemplate: (templateId: string) => void;
  /**
   * width of the template item
   *
   * @type {number}
   */
  templateItemWidth: number;
  /**
   * height of the template item
   *
   * @type {number}
   */
  templateItemHeight: number;
};
/**
 * A template suggestion renderer. For now, only accept image ( backoffice has not the feature to add video)
 *
 * @param {CoverModelsEditionPanelTemplateSuggestionItem}
 * @return {*}
 */
const TemplateSuggestionItem = ({
  item,
  coverWidth,
  coverHeight,
  title,
  subTitle,
  onSelectTemplate,
  templateItemWidth,
  templateItemHeight,
  isSelected,
}: CoverModelsEditionPanelTemplateSuggestionItem) => {
  const coverTemplate = useFragment(
    graphql`
      fragment CoverModelsEditionPanelTemplateSuggestedListItem_template on CoverTemplate
      @argumentDefinitions(
        cappedPixelRatio: {
          type: "Float!"
          provider: "../providers/CappedPixelRatio.relayprovider"
        }
      ) {
        id
        colorPalette
        kind
        suggested
        previewMedia {
          height
          id
          smallURI: uri(width: 125, pixelRatio: $cappedPixelRatio)
          width
        }
        data {
          sourceMedia {
            id
          }
          mediaStyle
          background {
            id
            uri
            resizeMode
          }
          backgroundStyle {
            backgroundColor
            patternColor
          }
          foreground {
            id
            uri
          }
          foregroundStyle {
            color
          }
          segmented
          merged
          contentStyle {
            orientation
            placement
          }
          titleStyle {
            fontFamily
            fontSize
            color
          }
          subTitleStyle {
            fontFamily
            fontSize
            color
          }
        }
      }
    `,
    item,
  );

  const intl = useIntl();
  const {
    id,
    previewMedia,
    data: { titleStyle, subTitleStyle, contentStyle },
  } = coverTemplate;
  const onPress = useCallback(
    () => onSelectTemplate(id),
    [id, onSelectTemplate],
  );
  const appearanceStyle = useStyleSheet(styleSheet);

  if (!previewMedia) {
    return null;
  }

  return (
    <PressableNative
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={intl.formatMessage({
        defaultMessage: 'Select this cover template template for your profile',
        description:
          'TemplateSelectorTemplateItem accessibilityHint template item',
      })}
      style={[
        appearanceStyle.templateContainer,
        {
          width: templateItemWidth,
          height: templateItemHeight,
          borderRadius: COVER_CARD_RADIUS * coverWidth + TEMPLATE_BORDER_WIDTH,
          borderColor: isSelected ? colors.black : 'transparent',
        },
      ]}
    >
      <Container
        style={[
          {
            width: coverWidth,
            height: coverHeight,
            borderRadius: COVER_CARD_RADIUS * coverWidth,
          },
          appearanceStyle.coverShadow,
        ]}
      >
        <View
          style={{
            overflow: 'hidden',
            borderRadius: COVER_CARD_RADIUS * coverWidth,
          }}
        >
          <MediaImageRenderer
            alt={`This is an image template suggested by the app`}
            aspectRatio={COVER_RATIO}
            source={{
              mediaId: previewMedia?.id,
              requestedSize: 125,
              uri: previewMedia?.smallURI,
            }}
            style={[
              {
                width: coverWidth,
                aspectRatio: COVER_RATIO,
                borderRadius: COVER_CARD_RADIUS * coverWidth,
              },
            ]}
          />
          <CoverTextPreview
            title={title}
            subTitle={subTitle}
            titleStyle={titleStyle}
            subTitleStyle={subTitleStyle}
            contentStyle={contentStyle}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            height={coverHeight}
          />
          <Image
            testID="cover-renderer-qrcode"
            accessibilityRole="image"
            source={require('#assets/qrcode.png')}
            style={appearanceStyle.qrCode}
          />
        </View>
      </Container>
    </PressableNative>
  );
};

const TemplateSuggestionMemo = memo(TemplateSuggestionItem); //if perf issue, we can improve the memoization with a custom comparison function

const styleSheet = createStyleSheet(appearance => ({
  coverShadow: shadow(appearance, 'center'),
  templateContainer: {
    borderWidth: TEMPLATE_BORDER_WIDTH,
  },
  qrCode: {
    position: 'absolute',
    top: '10%',
    height: '6.5%',
    left: '45%',
    width: '10%',
  },
}));
