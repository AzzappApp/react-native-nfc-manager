import MaskedView from '@react-native-masked-view/masked-view';
import { useCallback, useRef } from 'react';
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
import { TAB_BAR_HEIGHT } from '#ui/TabsBar';
import Text from '#ui/Text';
import {
  COVER_TEMPLATE_MINIATURE_RATIO,
  TEMPLATE_BORDER_WIDTH,
  TEMPLATE_GAP,
} from './coverEditionConstants';
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

  /**
   * callback called when the component is ready
   */
  onReady?: () => void;
  /**
   * callback called when the component is ready
   */
  onError?: () => void;
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
  onReady,
  onError,
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

  const templateCount = categories.reduce(
    (acc, category) => acc + category.templates.length,
    0,
  );

  const readyTemplateCount = useRef(0);
  const readyDispatched = useRef(false);

  const onTemplateReady = useCallback(() => {
    readyTemplateCount.current += 1;
    if (
      readyTemplateCount.current >= templateCount &&
      !readyDispatched.current
    ) {
      onReady?.();
      readyDispatched.current = true;
    }
  }, [onReady, templateCount]);

  const errorDispatched = useRef(false);

  const onTemplateError = useCallback(() => {
    if (!errorDispatched.current) {
      onError?.();
      errorDispatched.current = true;
    }
  }, [onError]);

  // TODO reset readyTemplateCount and errorDispatched when categories change

  const { width: windowWidth } = useWindowDimensions();
  const coverWidth = windowWidth * COVER_TEMPLATE_MINIATURE_RATIO;
  const coverHeight = coverWidth / COVER_RATIO;
  const templateItemWidth = coverWidth + 2 * TEMPLATE_BORDER_WIDTH - 0.5;
  const templateItemHeight = coverHeight + 2 * TEMPLATE_BORDER_WIDTH;
  const rowHeight = TAB_BAR_HEIGHT + coverHeight + 2 * TEMPLATE_BORDER_WIDTH;
  const { bottom: insetBottom } = useSafeAreaInsets();

  const appearanceStyle = useStyleSheet(computedStyle);
  const intl = useIntl();

  const getItemLayoutTemplate = useCallback(
    (_: any, index: number) => ({
      length: templateItemWidth,
      offset: 20 + (templateItemWidth + TEMPLATE_GAP) * index,
      index,
    }),
    [templateItemWidth],
  );

  const renderTemplate = useCallback(
    ({ item }: ListRenderItemInfo<Template>) => (
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
          styles.templateContainer,
          {
            width: templateItemWidth,
            height: templateItemHeight,
            borderRadius:
              COVER_CARD_RADIUS * coverWidth + TEMPLATE_BORDER_WIDTH,
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
            height={coverHeight}
            editionParameters={editionParameters}
            onReady={onTemplateReady}
            onError={onTemplateError}
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
      onTemplateReady,
      selectedTemplateId,
      subTitle,
      templateItemHeight,
      templateItemWidth,
      time,
      title,
      uri,
    ],
  );

  const getItemLayoutCategory = useCallback(
    (_: any, index: number) => ({
      length: rowHeight,
      offset: rowHeight * index,
      index,
    }),
    [rowHeight],
  );

  const renderCategory = useCallback(
    ({ item }: ListRenderItemInfo<Category>) => (
      <View style={{ height: rowHeight }}>
        <View style={styles.categoryHeader}>
          <View style={appearanceStyle.backgroundLine} />
          <Text variant="smallbold" style={styles.categoryTitle}>
            {item.category}
          </Text>
          <View style={appearanceStyle.backgroundLine} />
        </View>
        <FlatList
          data={item.templates}
          renderItem={renderTemplate}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={keyExtractorTemplates}
          getItemLayout={getItemLayoutTemplate}
          style={styles.templateList}
          contentContainerStyle={styles.templateListContainer}
        />
      </View>
    ),
    [
      appearanceStyle.backgroundLine,
      getItemLayoutTemplate,
      renderTemplate,
      rowHeight,
    ],
  );

  return (
    <View style={[styles.root, { width: windowWidth }]}>
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
            paddingBottom:
              BOTTOM_MENU_HEIGHT + (insetBottom > 0 ? insetBottom : 15) + 10,
          }}
          style={styles.templateList}
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

const computedStyle = createStyleSheet(appearance => ({
  coverShadow: {
    shadowColor: appearance === 'light' ? colors.black : colors.white,
    shadowOpacity: 0.11,
    shadowOffset: { width: 0, height: 4.69 },
    shadowRadius: 18.75,
  },
  backgroundLine: {
    flex: 1,
    height: 1,
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    alignSelf: 'center',
  },
}));

const styles = StyleSheet.create({
  root: {
    paddingTop: 10,
    flex: 1,
  },
  templateList: {
    overflow: 'visible',
  },
  templateListContainer: {
    columnGap: TEMPLATE_GAP,
    paddingHorizontal: 20,
  },
  templateContainer: {
    borderWidth: TEMPLATE_BORDER_WIDTH,
  },
  categoryHeader: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    alignItems: 'center',
  },
  categoryTitle: {
    paddingHorizontal: 15,
    textAlign: 'center',
  },
});
