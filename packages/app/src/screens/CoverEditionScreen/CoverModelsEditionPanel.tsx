import { useCallback, useEffect } from 'react';
import { FlatList, Dimensions, StyleSheet, Text, View } from 'react-native';
import { graphql, useRefetchableFragment } from 'react-relay';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/cardHelpers';
import { colors, fontFamilies } from '#theme';
import { TAB_BAR_HEIGHT } from '#ui/TabsBar';
import CoverTemplateRenderer from './CoverTemplateRenderer';
import type {
  CoverModelsEditionPanel_viewer$data,
  CoverModelsEditionPanel_viewer$key,
} from '@azzapp/relay/artifacts/CoverModelsEditionPanel_viewer.graphql';

import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ListRenderItemInfo } from 'react-native';

// Cannot exclude null for FL data type
type Category = ArrayItemType<
  CoverModelsEditionPanel_viewer$data['coverTemplatesByCategory']
>;

type Template = ArrayItemType<Category['templates']>;

export type TemplateData = Template['data'];

type CoverModelsEditionPanelProps = {
  segmented: boolean;
  viewer: CoverModelsEditionPanel_viewer$key;
  sourceUri?: string | null;
  mediaSize?: { width: number; height: number } | null;
  title?: string | null;
  subTitle?: string | null;
  selectedTemplateId: string | null;
  onSelectTemplate: (templateId: string, data: TemplateData) => void;
};

const CoverModelsEditionPanel = ({
  viewer,
  sourceUri,
  mediaSize,
  title,
  subTitle,
  segmented,
  selectedTemplateId,
  onSelectTemplate,
}: CoverModelsEditionPanelProps) => {
  const [{ coverTemplatesByCategory }, refetch] = useRefetchableFragment(
    graphql`
      fragment CoverModelsEditionPanel_viewer on Viewer
      @refetchable(queryName: "CoverEditionRefetchQuery")
      @argumentDefinitions(segmented: { type: "Boolean" }) {
        coverTemplatesByCategory(segmented: $segmented) {
          category
          templates {
            id
            ...CoverTemplateRenderer_template
            data {
              mediaStyle
              background {
                id
              }
              backgroundStyle {
                backgroundColor
                patternColor
              }
              foreground {
                id
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
        }
      }
    `,
    viewer,
  );

  useEffect(() => {
    refetch({ segmented });
  }, [refetch, segmented]);

  const onTemplateRenderPress = useCallback(
    (template: Template) => {
      onSelectTemplate(template.id, template.data);
    },
    [onSelectTemplate],
  );

  const renderTemplate = ({ item, index }: ListRenderItemInfo<Template>) => {
    if (item) {
      return (
        <View
          style={[
            styles.containerTemplate,
            {
              marginLeft: index === 0 ? 20 : 0,
              borderColor:
                selectedTemplateId === item.id ? colors.black : 'transparent',
            },
          ]}
        >
          <CoverTemplateRenderer
            template={item}
            onPress={() => onTemplateRenderPress(item)}
            coverWidth={COVER_MINIATURE_WIDTH}
            title={title}
            subTitle={subTitle}
            sourceMedia={
              sourceUri && mediaSize
                ? {
                    uri: sourceUri,
                    width: mediaSize.width,
                    height: mediaSize.height,
                  }
                : undefined
            }
            withShadow={false}
            style={{
              width: COVER_MINIATURE_WIDTH,
              height: COVER_MINIATURE_WIDTH / COVER_RATIO,
            }}
          />
        </View>
      );
    }
    return null;
  };

  const renderCategory = ({ item }: ListRenderItemInfo<Category>) => {
    if (item && item.templates?.length > 0) {
      return (
        <View style={styles.containerItemCtageory}>
          <View style={styles.categoryContainer}>
            <View style={styles.backgroundLine} />
            <Text style={styles.textCategory}>{item.category}</Text>
            <View style={styles.backgroundLine} />
          </View>
          <FlatList
            data={item.templates}
            renderItem={renderTemplate}
            horizontal
            ItemSeparatorComponent={ItemSeparatorComponent}
            showsHorizontalScrollIndicator={false}
            keyExtractor={keyExtractorTemplates}
          />
        </View>
      );
    }
    return null;
  };

  return (
    <View style={[styles.root]}>
      <FlatList
        renderItem={renderCategory}
        data={coverTemplatesByCategory}
        contentContainerStyle={styles.mainFLContentContainer}
        keyExtractor={keyExtractorCategory}
        getItemLayout={getItemLayoutCategory}
      />
    </View>
  );
};

const keyExtractorCategory = (item: Category, index: number) =>
  item?.category ?? `category-${index}`;

const keyExtractorTemplates = (item: Template, index: number) =>
  item?.id ?? `templates-${index}`;

const getItemLayoutCategory = (_data: any, index: number) => ({
  length: 26 + COVER_MINIATURE_HEIGHT + 2 * BORDER_SELECTED_WIDTH,
  offset: 100 * index,
  index,
});

export default CoverModelsEditionPanel;

// TODO refactor this, using Dimensions.get('window') is deprecated in favor of useWindowDimensions
const { width } = Dimensions.get('window');
const COVER_MINIATURE_WIDTH_RATIO = 4 / 15;
const COVER_MINIATURE_WIDTH = width * COVER_MINIATURE_WIDTH_RATIO;
const COVER_MINIATURE_HEIGHT = COVER_MINIATURE_WIDTH / COVER_RATIO;
const BORDER_SELECTED_WIDTH = 3.75;

const styles = StyleSheet.create({
  containerItemCtageory: {
    height: 26 + COVER_MINIATURE_HEIGHT + 2 * BORDER_SELECTED_WIDTH,
  },
  textCategory: {
    marginHorizontal: 5,
    ...fontFamilies.semiBold,
    color: colors.black,
    fontSize: 12,
  },
  categoryContainer: {
    height: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerTemplate: {
    width: COVER_MINIATURE_WIDTH + 2 * BORDER_SELECTED_WIDTH - 0.5,
    height: COVER_MINIATURE_HEIGHT + 2 * BORDER_SELECTED_WIDTH,
    borderRadius:
      COVER_CARD_RADIUS * COVER_MINIATURE_WIDTH + BORDER_SELECTED_WIDTH,
    borderWidth: BORDER_SELECTED_WIDTH,
  },
  mainFLContentContainer: { paddingBottom: TAB_BAR_HEIGHT + 30 },
  backgroundLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.grey50,
    alignSelf: 'center',
  },
  root: {
    paddingTop: 10,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  filterSelectionListContentContainer: { paddingHorizontal: 20 },
  filterSelectionList: { flex: 1, maxHeight: 120 },
});

const ItemSeparatorComponent = () => (
  <View style={{ width: 15, backgroundColor: 'transparent' }} />
);
