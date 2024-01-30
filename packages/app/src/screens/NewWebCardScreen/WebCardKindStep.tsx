import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { FlatList, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { combineLatest } from '@azzapp/shared/observableHelpers';
import { colors, shadow } from '#theme';
import { MediaImageRenderer } from '#components/medias';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { prefetchImage } from '#helpers/mediaHelpers';
import InfiniteCarousel from '#ui/InfiniteCaroussel';
import { TAB_BAR_HEIGHT } from '#ui/TabsBar';
import ToggleButton from '#ui/ToggleButton';
import ContinueButton from './ContinueButton';
import type {
  WebCardKindStep_webCardCategories$key,
  WebCardKindStep_webCardCategories$data,
} from '#relayArtifacts/WebCardKindStep_webCardCategories.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ListRenderItemInfo, LayoutChangeEvent } from 'react-native';

type WebCardKindStepProps = {
  webCardCategories: WebCardKindStep_webCardCategories$key;
  webCardCategoryId: string;
  onWebCardCategoryChange: (webCardCategoryId: string) => void;
  onNext: () => void;
};

const webCardCategoriesFragment = graphql`
  fragment WebCardKindStep_webCardCategories on WebCardCategory
  @relay(plural: true)
  @argumentDefinitions(
    pixelRatio: { type: "Float!", provider: "CappedPixelRatio.relayprovider" }
  ) {
    id
    medias {
      id
      uri(pixelRatio: $pixelRatio, width: 256)
    }
    label
  }
`;

/**
 *
 *
 * @param {WebCardKindStepProps} {
 *   webCardCategories: webCardCategoriesKey,
 *   webCardCategoryId,
 *   onWebCardCategoryChange,
 *   onNext,
 * }
 * @return {*}
 */
const WebCardKinStep = ({
  webCardCategories: webCardCategoriesKey,
  webCardCategoryId,
  onWebCardCategoryChange,
  onNext,
}: WebCardKindStepProps) => {
  const webCardCategories = useFragment(
    webCardCategoriesFragment,
    webCardCategoriesKey,
  );

  const [cardWidth, setCardWidth] = useState(0);
  const onMediaListLayout = useCallback(
    ({
      nativeEvent: {
        layout: { height },
      },
    }: LayoutChangeEvent) => {
      setCardWidth((height - 40) * COVER_RATIO);
    },
    [],
  );

  useEffect(() => {
    const observables = convertToNonNullArray(
      webCardCategories.flatMap(category =>
        category.medias?.map(media => prefetchImage(media.uri)),
      ),
    );
    const subscription = observables.length
      ? combineLatest(observables).subscribe({})
      : null;

    return () => {
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const intl = useIntl();
  const styles = useStyleSheet(styleSheet);

  const mediasKeyExtractor = useCallback((item: Media) => item.id, []);
  const borderRadius = COVER_CARD_RADIUS * cardWidth;

  const mediaStyle = useMemo(
    () => [
      styles.mediaImage,
      { width: cardWidth, borderRadius, aspectRatio: COVER_RATIO },
    ],
    [styles.mediaImage, cardWidth, borderRadius],
  );

  const mediaImageContainerStyle = useMemo(
    () => [styles.mediaImageContainer, { borderRadius }],
    [styles.mediaImageContainer, borderRadius],
  );

  const renderMediasItem = useCallback(
    (media: Media) => {
      return cardWidth > 0 ? (
        <View style={mediaImageContainerStyle}>
          <MediaImageRenderer
            testID="category-image"
            alt={intl.formatMessage({
              defaultMessage: 'Category image',
              description: 'WebCardKindStep - Category image alt',
            })}
            source={{ mediaId: media.id, requestedSize: 300, uri: media.uri }}
            style={mediaStyle}
          />
        </View>
      ) : null;
    },
    [cardWidth, intl, mediaImageContainerStyle, mediaStyle],
  );

  const selectedCategory = webCardCategories.find(
    category => category.id === webCardCategoryId,
  );

  const webCardCategoriesKeyExtractor = useCallback(
    (item: WebCardCategory) => item.id,
    [],
  );

  const renderWebCardCategoryItem = useCallback(
    ({ item }: ListRenderItemInfo<WebCardCategory>) => (
      <ToggleButton
        label={item.label}
        toggled={webCardCategoryId === item.id}
        onPress={() => onWebCardCategoryChange(item.id)}
        style={styles.webCardCategoryItem}
      />
    ),
    [webCardCategoryId, styles.webCardCategoryItem, onWebCardCategoryChange],
  );

  const getWebCardCategoryItemLayout = useCallback(
    (_: any, index: number) => ({
      length: TAB_BAR_HEIGHT + 18,
      offset: (TAB_BAR_HEIGHT + 18) * index,
      index,
    }),
    [],
  );

  const [categoryListReady, setCategoryListReady] = useState(false);

  const categoryListRef = useRef<FlatList>(null);

  const scrollToSelectedCategory = useCallback(() => {
    let timeout: any = null;
    if (!categoryListReady) {
      timeout = setTimeout(() => {
        const index = webCardCategories.findIndex(
          category => category.id === webCardCategoryId,
        );
        if (index > -1 && index < webCardCategories.length) {
          categoryListRef.current?.scrollToIndex({
            index,
            animated: false,
            viewPosition: 0.5,
          });
          setCategoryListReady(true);
        }
      }, 10);
    }
    return () => clearTimeout(timeout);
  }, [categoryListReady, webCardCategories, webCardCategoryId]);

  return (
    <View style={styles.root}>
      {selectedCategory && (
        <InfiniteCarousel
          key={selectedCategory.id}
          items={selectedCategory.medias ?? []}
          keyExtractor={mediasKeyExtractor}
          renderItem={renderMediasItem}
          itemWidth={cardWidth + 20}
          style={styles.mediasList}
          onLayout={onMediaListLayout}
        />
      )}
      <MaskedView
        maskElement={
          <LinearGradient
            colors={['transparent', 'black', 'black', 'transparent']}
            locations={[0.0, 0.29, 0.64, 1]}
            style={{ flex: 1 }}
          />
        }
        style={styles.webCardCategoriesListContainer}
      >
        <FlatList
          ref={categoryListRef}
          data={webCardCategories}
          keyExtractor={webCardCategoriesKeyExtractor}
          renderItem={renderWebCardCategoryItem}
          getItemLayout={getWebCardCategoryItemLayout}
          style={[
            styles.webCardCategoriesList,
            { opacity: categoryListReady ? 1 : 0 },
          ]}
          contentContainerStyle={[
            styles.webCardCategoriesListContent,
            { paddingVertical: 70 },
          ]}
          onLayout={scrollToSelectedCategory}
          showsVerticalScrollIndicator={false}
        />
      </MaskedView>
      <ContinueButton
        onPress={onNext}
        label={intl.formatMessage({
          defaultMessage: "Let's go!",
          description:
            'Create New Cover - Button Let"s go for choosing a webcard type',
        })}
      />
    </View>
  );
};

export default WebCardKinStep;

type WebCardCategory = ArrayItemType<WebCardKindStep_webCardCategories$data>;
type Media = ArrayItemType<WebCardCategory['medias']>;

const styleSheet = createStyleSheet(apperance => ({
  root: {
    flex: 1,
    paddingTop: 50,
  },
  mediasList: {
    flex: 1,
    paddingVertical: 20,
    paddingRight: 20,
  },
  mediaImageContainer: [
    {
      marginLeft: 20,
      backgroundColor: colors.grey200,
    },
    shadow(apperance),
  ],
  mediaImage: {
    aspectRatio: COVER_RATIO,
  },
  webCardCategoriesListContainer: {
    flex: 1,
  },
  webCardCategoriesList: {
    flex: 1,
  },
  webCardCategoriesListContent: {
    alignItems: 'center',
  },
  webCardCategoryItem: {
    marginVertical: 9,
  },
}));
