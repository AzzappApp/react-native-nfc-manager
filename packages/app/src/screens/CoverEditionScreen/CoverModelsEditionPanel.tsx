import { useCallback, useEffect } from 'react';
import {
  FlatList,
  PixelRatio,
  View,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { graphql, useRefetchableFragment } from 'react-relay';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/cardHelpers';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import TabsBar, { TAB_BAR_HEIGHT } from '#ui/TabsBar';
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
  isCreation: boolean;
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
  isCreation,
}: CoverModelsEditionPanelProps) => {
  const { width } = useWindowDimensions();
  const coverWidth = width * COVER_MINIATURE_RATIO;
  const coverHeight = coverWidth / COVER_RATIO;

  const appearanceStyle = useStyleSheet(computedStyle);
  const [{ coverTemplatesByCategory }, refetch] = useRefetchableFragment(
    graphql`
      fragment CoverModelsEditionPanel_viewer on Viewer
      @refetchable(queryName: "CoverEditionRefetchQuery")
      @argumentDefinitions(
        pixelRatio: { type: "Float", defaultValue: 2.0 }

        width: { type: "Float", defaultValue: 0.0 }
        segmented: { type: "Boolean" }
      ) {
        coverTemplatesByCategory(segmented: $segmented) {
          category
          templates {
            id
            kind
            ...CoverTemplateRenderer_template
            data {
              mediaStyle
              sourceMedia {
                id
                width
                height
                uri: uri(width: $width, pixelRatio: $pixelRatio)
              }
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
    refetch({
      segmented,
      pixelRatio: PixelRatio.get(),
      width: width * COVER_MINIATURE_RATIO,
    });
  }, [refetch, segmented, width]);

  //select the first template if it's a creation case when loading the coverEditionScreen
  useEffect(() => {
    if (isCreation && coverTemplatesByCategory.length > 0) {
      const template = coverTemplatesByCategory[0].templates[0];
      onSelectTemplate(template.id, template.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); //componnentDidMount behaviour

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
              width: coverWidth + 2 * BORDER_SELECTED_WIDTH - 0.5,
              height: coverHeight + 2 * BORDER_SELECTED_WIDTH,
              borderRadius:
                COVER_CARD_RADIUS * coverWidth + BORDER_SELECTED_WIDTH,
            },
            {
              marginLeft: index === 0 ? 20 : 0,
              borderColor:
                selectedTemplateId === item.id ? colors.black : 'transparent',
            },
            appearanceStyle.coverShadow,
          ]}
        >
          <CoverTemplateRenderer
            template={item}
            onPress={() => onTemplateRenderPress(item)}
            coverWidth={coverWidth}
            title={title}
            subTitle={subTitle}
            sourceMedia={
              item.kind === 'personal'
                ? sourceUri && mediaSize
                  ? {
                      uri: sourceUri,
                      width: mediaSize.width,
                      height: mediaSize.height,
                    }
                  : undefined
                : undefined
            }
            withShadow={false}
            style={{
              width: coverWidth,
              height: coverHeight,
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
        <View
          style={{
            height: 26 + coverHeight + 2 * BORDER_SELECTED_WIDTH,
          }}
        >
          <TabsBar
            currentTab={item.category}
            tabs={[{ tabKey: item.category, label: item.category }]}
          />
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

  const getItemLayoutCategory = (_data: any, index: number) => ({
    length: 26 + coverHeight + 2 * BORDER_SELECTED_WIDTH,
    offset: 100 * index,
    index,
  });

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

export default CoverModelsEditionPanel;

const COVER_MINIATURE_RATIO = 4 / 15; //arbitrary fixed value vased on the design

const BORDER_SELECTED_WIDTH = 3.75;

const computedStyle = createStyleSheet(appearance => ({
  coverShadow: {
    shadowColor: appearance === 'light' ? colors.black : colors.white,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4.69 },
    shadowRadius: 18.75,
  },
}));

const styles = StyleSheet.create({
  containerTemplate: {
    borderWidth: BORDER_SELECTED_WIDTH,
  },
  mainFLContentContainer: { paddingBottom: TAB_BAR_HEIGHT + 30 },
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
