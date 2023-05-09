import MaskedView from '@react-native-masked-view/masked-view';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, FlatList, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { graphql, useFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/cardHelpers';
import { combineLatest } from '@azzapp/shared/observableHelpers';
import { colors } from '#theme';
import { MediaImageRenderer, prefetchImage } from '#components/medias';
import useViewportSize, { insetTop } from '#hooks/useViewportSize';
import InfiniteCarousel from '#ui/InfiniteCaroussel';
import { TAB_BAR_HEIGHT } from '#ui/TabsBar';
import ToggleButton from '#ui/ToggleButton';
import ContinueButton from './ContinueButton';
import NewProfileScreenPageHeader from './NewProfileScreenPageHeader';
import type {
  ProfileKindStep_profileCategories$key,
  ProfileKindStep_profileCategories$data,
} from '@azzapp/relay/artifacts/ProfileKindStep_profileCategories.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ListRenderItemInfo, LayoutChangeEvent } from 'react-native';

type ProfileKindStepProps = {
  profileCategories: ProfileKindStep_profileCategories$key;
  profileCategoryId: string;
  onProfileCategoryChange: (profileCategoryId: string) => void;
  onNext: () => void;
};

const profileCategoriesFragment = graphql`
  fragment ProfileKindStep_profileCategories on ProfileCategory
  @relay(plural: true)
  @argumentDefinitions(
    pixelRatio: {
      type: "Float!"
      provider: "../providers/CappedPixelRatio.relayprovider"
    }
  ) {
    id
    medias {
      id
      uri(pixelRatio: $pixelRatio, width: 300)
    }
    label
  }
`;

/**
 *
 *
 * @param {ProfileKindStepProps} {
 *   profileCategories: profileCategoriesKey,
 *   profileCategoryId,
 *   onProfileCategoryChange,
 *   onNext,
 * }
 * @return {*}
 */
const ProfileKindStep = ({
  profileCategories: profileCategoriesKey,
  profileCategoryId,
  onProfileCategoryChange,
  onNext,
}: ProfileKindStepProps) => {
  const vp = useViewportSize();
  const profileCategories = useFragment(
    profileCategoriesFragment,
    profileCategoriesKey,
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
      profileCategories.flatMap(category =>
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

  const mediasKeyExtractor = useCallback((item: Media) => item.id, []);
  const borderRadius = COVER_CARD_RADIUS * cardWidth;
  const renderMediasItem = useCallback(
    (media: Media) => (
      <View style={[styles.mediaImageContainer, { borderRadius }]}>
        <MediaImageRenderer
          testID="category-image"
          alt={intl.formatMessage({
            defaultMessage: 'Category image',
            description: 'ProfileKindStep - Category image alt',
          })}
          width={300}
          aspectRatio={COVER_RATIO}
          source={media.id}
          uri={media.uri}
          style={[styles.mediaImage, { width: cardWidth, borderRadius }]}
        />
      </View>
    ),
    [borderRadius, cardWidth, intl],
  );

  const selectedCategory = profileCategories.find(
    category => category.id === profileCategoryId,
  );

  const profileCategoriesKeyExtractor = useCallback(
    (item: ProfileCategory) => item.id,
    [],
  );

  const renderProfileCategoryItem = useCallback(
    ({ item }: ListRenderItemInfo<ProfileCategory>) => (
      <ToggleButton
        label={item.label}
        toggled={profileCategoryId === item.id}
        onPress={() => onProfileCategoryChange(item.id)}
        style={styles.profileCategoryItem}
      />
    ),
    [profileCategoryId, onProfileCategoryChange],
  );

  const getProfileCategoryItemLayout = useCallback(
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
        const index = profileCategories.findIndex(
          category => category.id === profileCategoryId,
        );
        categoryListRef.current?.scrollToIndex({
          index,
          animated: false,
          viewPosition: 0.5,
        });
        setCategoryListReady(true);
      }, 10);
    }
    return () => clearTimeout(timeout);
  }, [categoryListReady, profileCategories, profileCategoryId]);

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: vp`${insetTop} + ${50}`,
        },
      ]}
    >
      <NewProfileScreenPageHeader
        activeIndex={0}
        title={
          <FormattedMessage
            defaultMessage="What best describe you?"
            description="NewProfileType User Type Screen - Title"
          />
        }
      />
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
        style={styles.profileCategoriesListContainer}
      >
        <FlatList
          ref={categoryListRef}
          data={profileCategories}
          keyExtractor={profileCategoriesKeyExtractor}
          renderItem={renderProfileCategoryItem}
          getItemLayout={getProfileCategoryItemLayout}
          style={[
            styles.profileCategoriesList,
            { opacity: categoryListReady ? 1 : 0 },
          ]}
          contentContainerStyle={[
            styles.profileCategoriesListContent,
            { paddingVertical: 70 },
          ]}
          onLayout={scrollToSelectedCategory}
          showsVerticalScrollIndicator={false}
        />
      </MaskedView>
      <ContinueButton onPress={onNext} />
    </View>
  );
};

export default ProfileKindStep;

type ProfileCategory = ArrayItemType<ProfileKindStep_profileCategories$data>;
type Media = ArrayItemType<ProfileCategory['medias']>;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  mediasList: {
    flex: 1,
    paddingVertical: 20,
    paddingRight: 20,
  },
  mediaImageContainer: {
    marginLeft: 20,
    shadowColor: colors.black,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 15 },
    shadowRadius: 6,
    backgroundColor: colors.grey200,
  },
  mediaImage: {
    aspectRatio: COVER_RATIO,
  },
  profileCategoriesListContainer: {
    flex: 1,
  },
  profileCategoriesList: {
    flex: 1,
  },
  profileCategoriesListContent: {
    alignItems: 'center',
  },
  profileCategoryItem: {
    marginVertical: 9,
  },
});
