import MaskedView from '@react-native-masked-view/masked-view';
import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { FlatList, View, StyleSheet, useWindowDimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { graphql, useFragment } from 'react-relay';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/cardHelpers';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Container from '#ui/Container';
import PressableNative from '#ui/PressableNative';
import TabsBar from '#ui/TabsBar';
import CoverTemplateRenderer from './CoverTemplateRenderer';
import type { EditionParameters } from '#components/gpu';
import type {
  CoverModelsEditionPanel_categories$key,
  CoverModelsEditionPanel_categories$data,
} from '@azzapp/relay/artifacts/CoverModelsEditionPanel_categories.graphql';

import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ListRenderItemInfo } from 'react-native';

type Category = ArrayItemType<CoverModelsEditionPanel_categories$data>;
type Template = ArrayItemType<Category['templates']>;

type CoverModelsEditionPanelProps = {
  categories: CoverModelsEditionPanel_categories$key;
  /**
   * Source Media to Override the Source Media of the template
   */
  uri?: string;
  /**
   * The source media type
   */
  kind?: 'image' | 'video' | 'videoFrame';
  /**
   * if the source media is a videoFrame, the time of the frame to display
   */
  time?: number | null;
  /**
   * the mask image uri
   */
  maskUri?: string | null;
  title?: string | null;
  subTitle?: string | null;
  selectedTemplateId: string | null;
  onSelectTemplate: (templateId: string) => void;
  isCreation: boolean;
  editionParameters?: EditionParameters;
};

const CoverModelsEditionPanel = ({
  categories: categoriesKey,
  uri,
  kind,
  time,
  maskUri,
  title,
  subTitle,
  selectedTemplateId,
  onSelectTemplate,
  editionParameters,
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

  const { width } = useWindowDimensions();
  const coverWidth = width * COVER_MINIATURE_RATIO;
  const coverHeight = coverWidth / COVER_RATIO;
  const { bottom } = useSafeAreaInsets();
  const appearanceStyle = useStyleSheet(computedStyle);

  const intl = useIntl();

  const renderTemplate = useCallback(
    ({ item, index }: ListRenderItemInfo<Template>) => (
      <PressableNative
        onPress={() => onSelectTemplate(item.id)}
        accessibilityRole="button"
        accessibilityHint={intl.formatMessage({
          defaultMessage:
            'Select this cover template template for your profile',
          description:
            'TemplateSelectorTemplateItem accessibilityHint template item',
        })}
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
          <CoverTemplateRenderer
            template={item}
            title={title}
            subTitle={subTitle}
            uri={uri}
            kind={kind}
            time={time}
            maskUri={maskUri}
            style={{
              width: coverWidth,
              height: coverHeight,
              borderRadius: COVER_CARD_RADIUS * coverWidth,
              overflow: 'hidden',
            }}
            editionParameters={editionParameters}
          />
        </Container>
      </PressableNative>
    ),
    [
      appearanceStyle.coverShadow,
      coverHeight,
      coverWidth,
      editionParameters,
      intl,
      kind,
      maskUri,
      onSelectTemplate,
      selectedTemplateId,
      subTitle,
      time,
      title,
      uri,
    ],
  );

  const renderCategory = useCallback(
    ({ item }: ListRenderItemInfo<Category>) => {
      if (item.templates?.length > 0) {
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
              style={styles.visible}
            />
          </View>
        );
      }
      return null;
    },
    [coverHeight, renderTemplate],
  );

  const getItemLayoutCategory = (_data: any, index: number) => ({
    length: 26 + coverHeight + 2 * BORDER_SELECTED_WIDTH,
    offset: 100 * index,
    index,
  });

  return (
    <View style={[styles.root, { width }]}>
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
          data={categories}
          keyExtractor={keyExtractorCategory}
          getItemLayout={getItemLayoutCategory}
          contentContainerStyle={{
            paddingBottom: BOTTOM_MENU_HEIGHT + (bottom > 0 ? bottom : 15) + 10,
          }}
          style={styles.visible}
        />
      </MaskedView>
    </View>
  );
};

const keyExtractorCategory = (item: Category, index: number) =>
  item?.category ?? `category-${index}`;

const keyExtractorTemplates = (item: Template, index: number) =>
  item?.id ?? `templates-${index}`;

export default CoverModelsEditionPanel;

const COVER_MINIATURE_RATIO = 3.5 / 15; //arbitrary fixed value vased on the design
const BORDER_SELECTED_WIDTH = 3.75;
const computedStyle = createStyleSheet(appearance => ({
  coverShadow: {
    shadowColor: appearance === 'light' ? colors.black : colors.white,
    shadowOpacity: 0.11,
    shadowOffset: { width: 0, height: 4.69 },
    shadowRadius: 18.75,
  },
}));

const styles = StyleSheet.create({
  root: {
    paddingTop: 10,
    flex: 1,
  },
  visible: { overflow: 'visible' },
  containerTemplate: {
    borderWidth: BORDER_SELECTED_WIDTH,
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
