import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { FlatList, View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { Observable } from 'relay-runtime';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { combineLatest } from '@azzapp/shared/observableHelpers';
import { isWebCardKindSubscription } from '@azzapp/shared/subscriptionHelpers';
import { colors } from '#theme';
import { MediaImageRenderer } from '#components/medias';
import { useRouter } from '#components/NativeRouter';
import PremiumIndicator from '#components/PremiumIndicator';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import fetchQueryAndRetain from '#helpers/fetchQueryAndRetain';
import { keyExtractor } from '#helpers/idHelpers';
import { prefetchImage } from '#helpers/mediaHelpers';
import relayScreen from '#helpers/relayScreen';
import useScreenInsets from '#hooks/useScreenInsets';
import Container from '#ui/Container';
import ContinueButton from '#ui/ContinueButton';
import { HEADER_HEIGHT } from '#ui/Header';

import InfiniteCarousel from '#ui/InfiniteCaroussel';
import { TAB_BAR_HEIGHT } from '#ui/TabsBar';
import Text from '#ui/Text';
import ToggleButton from '#ui/ToggleButton';
import WizardPagerHeader from '#ui/WizardPagerHeader';
import createWizardScreenFallback from '#ui/WizardScreenFallback';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type {
  WebCardKindSelectionScreenQuery,
  WebCardKindSelectionScreenQuery$data,
} from '#relayArtifacts/WebCardKindSelectionScreenQuery.graphql';
import type { WebCardKindSelectionRoute } from '#routes';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ListRenderItemInfo, LayoutChangeEvent } from 'react-native';

const query = graphql`
  query WebCardKindSelectionScreenQuery($pixelRatio: Float!) {
    currentUser {
      isPremium
    }
    webCardCategories {
      id
      medias {
        id
        uri(pixelRatio: $pixelRatio, width: 256)
      }
      label
      webCardKind
    }
  }
`;

const WebCardKindSelectionScreen = ({
  preloadedQuery,
}: RelayScreenProps<
  WebCardKindSelectionRoute,
  WebCardKindSelectionScreenQuery
>) => {
  const { webCardCategories, currentUser } = usePreloadedQuery(
    query,
    preloadedQuery,
  );
  const [webCardCategoryId, setWebCardCategoryId] = useState<string | null>(
    webCardCategories?.[0]?.id ?? null,
  );

  const [cardWidth, setCardWidth] = useState(0);
  const onMediaListLayout = useCallback(
    ({
      nativeEvent: {
        layout: { height },
      },
    }: LayoutChangeEvent) => {
      setCardWidth(height * COVER_RATIO);
    },
    [],
  );

  const router = useRouter();
  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const onNext = useCallback(() => {
    if (webCardCategoryId) {
      router.push({
        route: 'WEBCARD_FORM',
        params: {
          webCardCategoryId,
        },
      });
    }
  }, [router, webCardCategoryId]);

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

  const borderRadius = COVER_CARD_RADIUS * cardWidth;

  const mediaStyle = useMemo(
    () => [
      styles.mediaImage,
      {
        width: cardWidth,
        borderRadius,
        aspectRatio: COVER_RATIO,
      },
    ],
    [styles.mediaImage, cardWidth, borderRadius],
  );

  const linearGradientWidth = useMemo(() => {
    return (mediaStyle[1] as { width: number }).width + 2;
  }, [mediaStyle]);

  const mediaImageContainerStyle = useMemo(
    () => [
      styles.mediaImageContainer,
      { borderRadius, position: 'relative' as const },
    ],
    [styles.mediaImageContainer, borderRadius],
  );

  const renderMediasItem = useCallback(
    (media: Media) => {
      return cardWidth > 0 ? (
        <View style={mediaImageContainerStyle}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', '#FFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            locations={[0, 0.95]}
            style={[
              mediaStyle,
              { width: linearGradientWidth },
              styles.mediaLinear,
            ]}
          />
          <MediaImageRenderer
            testID="category-image"
            alt={intl.formatMessage({
              defaultMessage: 'Category image',
              description: 'WebCardKindStep - Category image alt',
            })}
            source={{ mediaId: media.id, requestedSize: 300, uri: media.uri }}
            style={[mediaStyle]}
          />
        </View>
      ) : null;
    },
    [
      cardWidth,
      intl,
      linearGradientWidth,
      mediaImageContainerStyle,
      mediaStyle,
      styles.mediaLinear,
    ],
  );

  const selectedCategory = webCardCategories.find(
    category => category.id === webCardCategoryId,
  );

  const renderWebCardCategoryItem = useCallback(
    ({ item }: ListRenderItemInfo<WebCardCategory>) => (
      <ToggleButton
        label={item.label}
        toggled={webCardCategoryId === item.id}
        onPress={() => setWebCardCategoryId(item.id)}
        style={styles.webCardCategoryItem}
        rightElement={
          <PremiumIndicator
            isRequired={
              !currentUser?.isPremium &&
              isWebCardKindSubscription(item.webCardKind)
            }
          />
        }
      />
    ),
    [webCardCategoryId, styles.webCardCategoryItem, currentUser?.isPremium],
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

  const insets = useScreenInsets();

  return (
    <Container
      style={{
        flex: 1,
        paddingTop: insets.top,
      }}
    >
      <WizardPagerHeader
        title={
          <Text variant="large" style={styles.titleText}>
            {intl.formatMessage(
              {
                defaultMessage: 'Select a WebCard{azzappA} type',
                description: 'WebCard kind selection screen title',
              },
              { azzappA: <Text variant="azzapp">a</Text> },
            )}
          </Text>
        }
        rightElement={<View style={{ height: HEADER_HEIGHT }} />}
        rightElementWidth={80}
        backIcon="arrow_down"
        currentPage={0}
        nbPages={5}
        onBack={onBack}
      />
      <View style={styles.content}>
        {selectedCategory && (
          <InfiniteCarousel
            key={selectedCategory.id}
            items={selectedCategory.medias ?? []}
            keyExtractor={keyExtractor}
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
            keyExtractor={keyExtractor}
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
    </Container>
  );
};

WebCardKindSelectionScreen.options = {
  replaceAnimation: 'push',
  stackAnimation: 'slide_from_bottom',
};

export default relayScreen(WebCardKindSelectionScreen, {
  query,
  getVariables: () => ({ pixelRatio: 2 }),
  profileBound: false,
  fallback: createWizardScreenFallback({
    currentPage: 0,
    nbPages: 5,
    backIcon: 'arrow_down',
  }),
  prefetch: (_, environment) => {
    const pixelRatio = 2;
    return fetchQueryAndRetain<WebCardKindSelectionScreenQuery>(
      environment,
      query,
      {
        pixelRatio,
      },
    ).mergeMap(({ webCardCategories }) => {
      const observables = convertToNonNullArray(
        webCardCategories.flatMap(category =>
          category.medias?.map(media => prefetchImage(media.uri)),
        ),
      );
      if (observables.length === 0) {
        return Observable.from(null);
      }
      return combineLatest(observables);
    });
  },
});

type WebCardCategory = ArrayItemType<
  WebCardKindSelectionScreenQuery$data['webCardCategories']
>;
type Media = ArrayItemType<WebCardCategory['medias']>;

const styleSheet = createStyleSheet(() => ({
  content: {
    flex: 1,
  },
  mediasList: {
    flex: 1,
    paddingTop: 30,
    paddingBottom: 20,
    paddingRight: 20,
  },
  mediaImageContainer: [
    {
      marginLeft: 20,
      backgroundColor: colors.grey200,
    },
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
  badge: {
    marginLeft: 5,
  },
  titleText: {
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  mediaLinear: {
    position: 'absolute',
    zIndex: 1,
    top: -1,
    left: -1,
  },
}));
