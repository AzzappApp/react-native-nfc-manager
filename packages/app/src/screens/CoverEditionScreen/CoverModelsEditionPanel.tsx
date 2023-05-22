import MaskedView from '@react-native-masked-view/masked-view';
import { useCallback, useMemo, useRef } from 'react';
import { FlatList, View, StyleSheet, useWindowDimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { graphql, useFragment } from 'react-relay';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import { TAB_BAR_HEIGHT } from '#ui/TabsBar';
import {
  COVER_TEMPLATE_MINIATURE_RATIO,
  TEMPLATE_BORDER_WIDTH,
} from './coverEditionConstants';
import CoverModelsEditionPanelTemplateList from './CoverModelsEditionPanelTemplateList';
import CoverModelsEditionPanelTemplateSuggestedList from './CoverModelsEditionPanelTemplateSuggestedList';

import type { CoverTemplateItemProps } from './CoverModelsEditionPanelTemplateList';
import type {
  CoverModelsEditionPanel_categories$data,
  CoverModelsEditionPanel_categories$key,
} from '@azzapp/relay/artifacts/CoverModelsEditionPanel_categories.graphql';
import type { CoverModelsEditionPanelTemplateSuggestedList_suggestion$key } from '@azzapp/relay/artifacts/CoverModelsEditionPanelTemplateSuggestedList_suggestion.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ListRenderItemInfo, StyleProp, ViewStyle } from 'react-native';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type Category = ArrayItemType<CoverModelsEditionPanel_categories$data>;

type CoverModelsEditionPanelProps = CoverTemplateItemProps &
  Omit<ViewProps, 'children'> & {
    /**
     *
     *
     * @type {CoverModelsEditionPanel_categories$key}
     */
    categories: CoverModelsEditionPanel_categories$key;
    /**
     *
     *
     * @type {CoverModelsEditionPanelTemplateSuggestedList_suggestion$key}
     */
    viewer: CoverModelsEditionPanelTemplateSuggestedList_suggestion$key;
    /**
     * suggestedTemplateMode , true is we are using the suggested template bahviour
     *
     * @type {boolean}
     */
    hasSuggestedTemplates: boolean;
    /**
     * callback called when the component is ready
     *
     */
    onReady?: () => void;
    /**
     * callback called when the component is not ready
     */
    onError?: () => void;
    /**
     *  The flatlist contentContainerStyle
     *
     * @type {StyleProp<ViewStyle>}
     */
    contentContainerStyle?: StyleProp<ViewStyle>;
  };

const CoverModelsEditionPanel = ({
  categories: categoriesKey,
  viewer: suggestionsKey,
  uri,
  kind,
  maskUri,
  title,
  subTitle,
  hasSuggestedTemplates = false,
  selectedTemplateId,
  onSelectTemplate,
  editionParameters,
  onReady,
  onError,
  contentContainerStyle,
  ...props
}: CoverModelsEditionPanelProps) => {
  const categories = useFragment(
    graphql`
      fragment CoverModelsEditionPanel_categories on CoverTemplateCategory
      @relay(plural: true) {
        category
        templates {
          id
          ...CoverTemplateRenderer_template
        }
      }
    `,
    categoriesKey,
  );

  const readyCategoryCount = useRef(0);
  const readyDispatched = useRef(false);
  const categoryToRender = hasSuggestedTemplates ? 2 : 3;
  const onCategoryReady = useCallback(() => {
    readyCategoryCount.current += 1;
    if (
      readyCategoryCount.current >=
        Math.min(categoryToRender, categories.length) &&
      !readyDispatched.current
    ) {
      onReady?.();
      readyDispatched.current = true;
    }
  }, [categories.length, categoryToRender, onReady]);

  const errorDispatched = useRef(false);

  const onCategoryError = useCallback(() => {
    if (!errorDispatched.current) {
      onError?.();
      errorDispatched.current = true;
    }
  }, [onError]);

  // TODO reset readyTemplateCount and errorDispatched when categories change
  const { width: windowWidth } = useWindowDimensions();
  const coverWidth = windowWidth * COVER_TEMPLATE_MINIATURE_RATIO;
  const coverHeight = coverWidth / COVER_RATIO;
  const rowHeight = TAB_BAR_HEIGHT + coverHeight + 2 * TEMPLATE_BORDER_WIDTH;

  const getItemLayoutCategory = useCallback(
    (_: any, index: number) => ({
      length: rowHeight,
      offset: rowHeight * index,
      index,
    }),
    [rowHeight],
  );

  const renderCategory = useCallback(
    ({ item, index }: ListRenderItemInfo<Category | string>) => {
      if (index === 0 && hasSuggestedTemplates) {
        return (
          <CoverModelsEditionPanelTemplateSuggestedList
            viewer={suggestionsKey}
            coverWidth={coverWidth}
            coverHeight={coverHeight}
            title={title}
            subTitle={subTitle}
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={onSelectTemplate}
            rowHeight={rowHeight}
          />
        );
      }

      return (
        <CoverModelsEditionPanelTemplateList
          item={item as Category}
          coverWidth={coverWidth}
          coverHeight={coverHeight}
          uri={uri}
          kind={kind}
          maskUri={maskUri}
          title={title}
          subTitle={subTitle}
          selectedTemplateId={selectedTemplateId}
          onSelectTemplate={onSelectTemplate}
          editionParameters={editionParameters}
          onTemplateReady={onCategoryReady}
          onTemplateError={onCategoryError}
          rowHeight={rowHeight}
        />
      );
    },
    [
      hasSuggestedTemplates,
      coverWidth,
      coverHeight,
      uri,
      kind,
      maskUri,
      title,
      subTitle,
      selectedTemplateId,
      onSelectTemplate,
      editionParameters,
      onCategoryReady,
      onCategoryError,
      rowHeight,
      suggestionsKey,
    ],
  );

  const templateData = useMemo(() => {
    if (hasSuggestedTemplates) {
      return ['suggestion', ...categories];
    } else {
      return categories;
    }
  }, [categories, hasSuggestedTemplates]);

  return (
    <View {...props}>
      <MaskedView
        maskElement={
          <LinearGradient
            colors={[
              'transparent',
              colors.grey100,
              colors.grey100,
              'transparent',
            ]}
            locations={[0.0, 0.06, 0.994, 1]}
            style={{ flex: 1 }}
          />
        }
      >
        <FlatList
          renderItem={renderCategory}
          data={templateData}
          keyExtractor={keyExtractorCategory}
          getItemLayout={getItemLayoutCategory}
          contentContainerStyle={contentContainerStyle}
          style={styles.templateList}
          initialNumToRender={categoryToRender}
        />
      </MaskedView>
    </View>
  );
};

const keyExtractorCategory = (item: Category | string, index: number) => {
  if (typeof item === 'string') {
    return item;
  }
  return item?.category ?? `category-${index}`;
};

export default CoverModelsEditionPanel;

const styles = StyleSheet.create({
  templateList: {
    overflow: 'visible',
  },
});
