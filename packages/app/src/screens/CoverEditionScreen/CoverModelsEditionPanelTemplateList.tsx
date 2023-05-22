import { memo, useCallback, useRef } from 'react';
import { useIntl } from 'react-intl';
import { View, StyleSheet, FlatList } from 'react-native';
import { COVER_CARD_RADIUS } from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Container from '#ui/Container';
import PressableNative from '#ui/PressableNative';
import TitleWithLine from '#ui/TitleWithLine';
import { TEMPLATE_BORDER_WIDTH, TEMPLATE_GAP } from './coverEditionConstants';

import CoverTemplateRenderer from './CoverTemplateRenderer';
import type { EditionParameters } from '#components/gpu';
import type { CoverModelsEditionPanel_categories$data } from '@azzapp/relay/artifacts/CoverModelsEditionPanel_categories.graphql';

import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ListRenderItemInfo } from 'react-native';

type Category = ArrayItemType<CoverModelsEditionPanel_categories$data>;
type Template = ArrayItemType<Category['templates']>;

export type CoverTemplateItemProps = {
  /**
   * Source Media to Override the Source Media of the template
   *
   * @type {string}
   */
  uri?: string;
  /**
   * The source media type
   *
   * @type {('image' | 'video' | 'videoFrame')}
   */
  kind?: 'image' | 'video' | 'videoFrame';
  /**
   * the mask image uri
   * @type {(string | null)}
   */
  maskUri?: string | null;
  /**
   * profile title
   *
   * @type {(string | null)}
   */
  title?: string | null;
  /**
   * profile subtitle
   *
   *
   * @type {(string | null)}
   */
  subTitle?: string | null;
  /**
   * the selected template id
   *
   * @type {(string | null)}
   */
  selectedTemplateId: string | null;
  /**
   * callback when selecting a template
   *
   */
  onSelectTemplate: (templateId: string) => void;
  /**
   * the edition parameters
   *
   * @type {EditionParameters}
   */
  editionParameters?: EditionParameters;
};
type CoverModelsEditionPanelTemplateListProps = CoverTemplateItemProps & {
  item: Category;

  rowHeight: number;

  coverWidth: number;

  coverHeight: number;

  onTemplateReady: () => void;

  onTemplateError: () => void;
};

const INITIAL_NUMBER_RENDER = 4;
/**
 * Will render a cover template Item List for a specific category
 *
 * @param {CoverModelsEditionPanelTemplateListProps} {
 *   item,
 *   rowHeight,
 *   coverWidth,
 *   coverHeight,
 *   onTemplateReady,
 *   onTemplateError,
 *   uri,
 *   kind,
 *   maskUri,
 *   title,
 *   subTitle,
 *   selectedTemplateId,
 *   onSelectTemplate,
 *   editionParameters,
 * }
 * @return {*}
 */
const CoverModelsEditionPanelTemplateList = ({
  item,
  rowHeight,
  coverWidth,
  coverHeight,
  onTemplateReady,
  onTemplateError,
  uri,
  kind,
  maskUri,
  title,
  subTitle,
  selectedTemplateId,
  onSelectTemplate,
  editionParameters,
}: CoverModelsEditionPanelTemplateListProps) => {
  const templateItemWidth = coverWidth + 2 * TEMPLATE_BORDER_WIDTH - 0.5;
  const templateItemHeight = coverHeight + 2 * TEMPLATE_BORDER_WIDTH;

  const readyTemplateCount = useRef(0);
  const readyDispatched = useRef(false);

  const onReady = useCallback(() => {
    readyTemplateCount.current += 1;
    if (
      readyTemplateCount.current >=
        Math.min(item.templates.length, INITIAL_NUMBER_RENDER) &&
      !readyDispatched.current
    ) {
      onTemplateReady?.();
      readyDispatched.current = true;
    }
  }, [item.templates.length, onTemplateReady]);

  const renderTemplate = useCallback(
    ({ item }: ListRenderItemInfo<Template>) => (
      <TemplateItemMemo
        uri={uri}
        item={item}
        maskUri={maskUri}
        editionParameters={editionParameters}
        kind={kind}
        coverWidth={coverWidth}
        coverHeight={coverHeight}
        isSelected={selectedTemplateId === item.id}
        onSelectTemplate={onSelectTemplate}
        title={title}
        subTitle={subTitle}
        onTemplateReady={onReady}
        onTemplateError={onTemplateError}
        templateItemWidth={templateItemWidth}
        templateItemHeight={templateItemHeight}
      />
    ),
    [
      coverHeight,
      coverWidth,
      editionParameters,
      kind,
      maskUri,
      onReady,
      onSelectTemplate,
      onTemplateError,
      selectedTemplateId,
      subTitle,
      templateItemHeight,
      templateItemWidth,
      title,
      uri,
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
      <TitleWithLine title={item.category} />
      <FlatList
        data={item.templates}
        renderItem={renderTemplate}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractorTemplates}
        getItemLayout={getItemLayoutTemplate}
        style={styles.templateList}
        contentContainerStyle={styles.templateListContainer}
        initialNumToRender={INITIAL_NUMBER_RENDER}
      />
    </View>
  );
};

export default CoverModelsEditionPanelTemplateList;

const styles = StyleSheet.create({
  templateList: {
    overflow: 'visible',
  },
  templateListContainer: {
    columnGap: TEMPLATE_GAP,
    paddingHorizontal: 20,
  },
});

const keyExtractorTemplates = (item: Template, index: number) =>
  item?.id ?? `templates-${index}`;

type CoverModelsEditionPanelTemplateListItemProps = Omit<
  CoverTemplateItemProps,
  'selectedTemplateId'
> & {
  /**
   *  the template item to render
   *
   * @type {Template}
   */
  item: Template;
  /**
   * width of the cover insode the template item
   *
   * @type {number}
   */
  coverWidth: number;
  /**
   * height of the cover insode the template item
   *
   * @type {number}
   */
  coverHeight: number;
  /**
   * if the template is selected
   *
   * @type {boolean}
   */
  isSelected: boolean;
  /**
   * if the source media is a videoFrame, the time of the frame to display
   */
  time?: number | null;
  /**
   * width of the template item
   *
   * @type {number}
   */
  templateItemWidth: number;
  /**
   * height of a template item
   *
   * @type {number}
   */
  templateItemHeight: number;
  /**
   * Callback if the template loading had an error
   *
   */
  onTemplateError: () => void;
  /**
   *
   * Callback if the template laod successfully
   */
  onTemplateReady: () => void;
};

//we are in flatlist, on a complex screen, use FB recommendation for FL
const TemplateItem = ({
  item,
  coverWidth,
  coverHeight,
  isSelected,
  onSelectTemplate,
  title,
  subTitle,
  uri,
  kind,
  maskUri,
  editionParameters,
  templateItemWidth,
  templateItemHeight,
  onTemplateError,
  onTemplateReady,
}: CoverModelsEditionPanelTemplateListItemProps) => {
  const appearanceStyle = useStyleSheet(computedStyle);
  const intl = useIntl();

  const onPress = useCallback(
    () => onSelectTemplate(item.id),
    [item.id, onSelectTemplate],
  );

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
        {uri && (
          <CoverTemplateRenderer
            template={item}
            title={title}
            subTitle={subTitle}
            uri={uri}
            kind={kind}
            maskUri={maskUri}
            style={{
              width: coverWidth,
              height: coverHeight,
              borderRadius: COVER_CARD_RADIUS * coverWidth,
              overflow: 'hidden',
            }}
            height={coverHeight}
            editionParameters={editionParameters}
            onReady={onTemplateReady}
            onError={onTemplateError}
          />
        )}
      </Container>
    </PressableNative>
  );
};

const TemplateItemMemo = memo(TemplateItem); //if perf issue, we can improve the memoization with a custom comparison function

const computedStyle = createStyleSheet(appearance => ({
  coverShadow: {
    shadowColor: appearance === 'light' ? colors.black : colors.white,
    shadowOpacity: 0.11,
    shadowOffset: { width: 0, height: 4.69 },
    shadowRadius: 18.75,
  },
  templateContainer: {
    borderWidth: TEMPLATE_BORDER_WIDTH,
  },
}));
