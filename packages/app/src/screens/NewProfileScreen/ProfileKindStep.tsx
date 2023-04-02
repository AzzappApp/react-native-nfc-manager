import MaskedView from '@react-native-masked-view/masked-view';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { StyleSheet, FlatList, View, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { graphql, useFragment } from 'react-relay';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/cardHelpers';
import { colors } from '#theme';
import useViewportSize, { insetBottom, insetTop } from '#hooks/useViewportSize';
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

// TODO preload medias
const ProfileKindStep = ({
  profileCategories: profileCategoriesKey,
  profileCategoryId,
  onProfileCategoryChange,
  onNext,
}: ProfileKindStepProps) => {
  const profileCategories = useFragment(
    profileCategoriesFragment,
    profileCategoriesKey,
  );

  const vp = useViewportSize();

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
    const prefetchImages = () =>
      Promise.all(
        profileCategories.flatMap(category =>
          category.medias?.map(media => Image.prefetch(media.uri)),
        ),
      );
    void prefetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const borderRadius = COVER_CARD_RADIUS * cardWidth;
  const mediasKeyExtractor = useCallback((item: Media) => item.id, []);
  const renderMediasItem = useCallback(
    (media: Media) => (
      <View style={[styles.mediaImageContainer, { borderRadius }]}>
        <Image
          testID="category-image"
          accessibilityRole="image"
          source={{ uri: media.uri }}
          style={[styles.mediaImage, { borderRadius, width: cardWidth }]}
        />
      </View>
    ),
    [borderRadius, cardWidth],
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
  const [categoryListHeight, setCategoryListHeight] = useState(0);
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

  const onProfileListLayout = useCallback(
    ({
      nativeEvent: {
        layout: { height },
      },
    }: LayoutChangeEvent) => {
      setCategoryListHeight(height);
      scrollToSelectedCategory();
    },
    [scrollToSelectedCategory],
  );

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: vp`${insetTop} + ${90}`,
          marginBottom: vp`${insetBottom} + ${10}`,
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
        <InfiniteCarousel<Media>
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
            locations={[0.05, 0.2, 0.7, 0.95]}
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
            { paddingVertical: categoryListHeight / 4 },
          ]}
          onLayout={onProfileListLayout}
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
    backgroundColor: '#FFF',
  },
  mediasList: {
    flex: 1,
    paddingVertical: 20,
    paddingRight: 20,
  },
  mediaImageContainer: {
    marginLeft: 20,
    shadowColor: colors.black,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 6,
    backgroundColor: colors.lightGrey,
  },
  mediaImage: {
    aspectRatio: COVER_RATIO,
  },
  profileCategoriesListContainer: {
    flex: 1.2,
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
