import { Suspense, useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Linking, StyleSheet, useWindowDimensions, View } from 'react-native';
import { graphql, useLazyLoadQuery, usePaginationFragment } from 'react-relay';
import { useDebounce } from 'use-debounce';
import MediaGridList, {
  MediaGridListFallback,
} from '#components/MediaGridList';
import { useProfileInfos } from '#hooks/authStateHooks';
import PressableOpacity from '#ui/PressableOpacity';
import SearchBarStatic from '#ui/SearchBarStatic';
import Text from '#ui/Text';
import type { SourceMedia } from '#helpers/mediaHelpers';
import type { StockMediaList_photos$key } from '#relayArtifacts/StockMediaList_photos.graphql';
import type { StockMediaList_video$key } from '#relayArtifacts/StockMediaList_video.graphql';
import type { StockMediaListQuery } from '#relayArtifacts/StockMediaListQuery.graphql';
import type { ViewProps } from 'react-native';

type StockMediaListProps = Omit<ViewProps, 'children'> & {
  kind: 'image' | 'video';
  selectedMediasIds: string[];
  onMediaSelected: (media: SourceMedia) => void;
};

const StockMediaList = ({
  kind,
  selectedMediasIds,
  onMediaSelected,
  style,
  ...props
}: StockMediaListProps) => {
  const profileInfos = useProfileInfos();
  const [search, setSearch] = useState<string | null>(null);
  const [debouncedSearch] = useDebounce(search, 300);

  if (!profileInfos?.profileId) {
    throw new Error(
      'StockMediaList should be used only when user is logged in',
    );
  }

  const onSearchChange = useCallback((text?: string) => {
    setSearch(text || null);
  }, []);

  const onStockMediaSelect = useCallback(
    (media: StockPhoto | StockVideo) => {
      if (media.__typename === 'StockImage') {
        onMediaSelected({
          id: media.id,
          kind: 'image',
          uri: media.url,
          thumbnail: media.thumbnail,
          width: media.width,
          height: media.height,
        });
      } else {
        onMediaSelected({
          id: media.id,
          kind: 'video',
          uri: media.url,
          thumbnail: media.thumbnail,
          width: media.width,
          height: media.height,
          duration: media.duration,
          rotation: 0,
        });
      }
    },
    [onMediaSelected],
  );

  const openPexels = useCallback(() => {
    Linking.openURL('https://www.pexels.com/');
  }, []);

  const intl = useIntl();
  const { width: windowWidth } = useWindowDimensions();
  const searchPlaceholder =
    kind === 'image'
      ? intl.formatMessage({
          defaultMessage: 'Search for an image',
          description: 'Search placeholder for stock images',
        })
      : intl.formatMessage({
          defaultMessage: 'Search for a video',
          description: 'Search placeholder for stock videos',
        });

  return (
    <View style={[style, styles.root]} {...props}>
      <SearchBarStatic
        value={search ?? ''}
        placeholder={searchPlaceholder}
        onChangeText={onSearchChange}
        style={styles.searchBar}
      />
      <Suspense
        fallback={<MediaGridListFallback numColumns={4} width={windowWidth} />}
      >
        <StockMediaListQueryRenderer
          profileId={profileInfos.profileId}
          kind={kind}
          search={debouncedSearch}
          selectedMediasIds={selectedMediasIds}
          onStockMediaSelect={onStockMediaSelect}
        />
      </Suspense>
      <PressableOpacity onPress={openPexels} style={styles.pexelsLink}>
        <Text variant="medium" appearance="dark">
          <FormattedMessage
            defaultMessage="Powered by Pexels"
            description="Pexels link in stock photo/video list"
          />
        </Text>
      </PressableOpacity>
    </View>
  );
};

export default StockMediaList;

type StockMediaListQueryRendererProps = {
  profileId: string;
  kind: 'image' | 'video';
  search: string | null;
  selectedMediasIds: string[];
  onStockMediaSelect: (media: StockPhoto | StockVideo) => void;
};

const StockMediaListQueryRenderer = ({
  profileId,
  kind,
  search,
  selectedMediasIds,
  onStockMediaSelect,
}: StockMediaListQueryRendererProps) => {
  const data = useLazyLoadQuery<StockMediaListQuery>(
    graphql`
      query StockMediaListQuery(
        $profileId: ID!
        $search: String
        $isImage: Boolean!
      ) {
        node(id: $profileId) {
          ... on Profile {
            ...StockMediaList_photos
              @arguments(search: $search)
              @include(if: $isImage)
            ...StockMediaList_video
              @arguments(search: $search)
              @skip(if: $isImage)
          }
        }
      }
    `,
    {
      profileId,
      search,
      isImage: kind === 'image',
    },
  );

  // TODO handle with new relay system for nullability
  if (!data.node) {
    return null;
  }

  return (
    <StockMediaListGridRenderer
      kind={kind}
      profile={data.node}
      selectedMediasIds={selectedMediasIds}
      onStockMediaSelect={onStockMediaSelect}
    />
  );
};

const stockImageFragment = graphql`
  fragment StockMediaList_photos on Profile
  @refetchable(queryName: "StockMediaListStockImagesQuery")
  @argumentDefinitions(
    search: { type: "String" }
    after: { type: String }
    first: { type: Int, defaultValue: 50 }
  ) {
    searchStockPhotos(search: $search, after: $after, first: $first)
      @connection(key: "StockMediaList_searchStockPhotos") {
      edges {
        node {
          __typename
          id
          url
          width
          height
          author
          thumbnail
        }
      }
    }
  }
`;

const stockVideoFragment = graphql`
  fragment StockMediaList_video on Profile
  @refetchable(queryName: "StockMediaListStockVideoQuery")
  @argumentDefinitions(
    search: { type: "String" }
    after: { type: String }
    first: { type: Int, defaultValue: 52 }
  ) {
    searchStockVideos(search: $search, after: $after, first: $first)
      @connection(key: "StockMediaList_searchStockVideos") {
      edges {
        node {
          __typename
          id
          url
          width
          height
          author
          thumbnail
          duration
        }
      }
    }
  }
`;

type StockMediaListGridRendererProps = {
  kind: 'image' | 'video';
  profile: StockMediaList_photos$key | StockMediaList_video$key;
  selectedMediasIds: string[];
  onStockMediaSelect: (media: StockPhoto | StockVideo) => void;
};

const StockMediaListGridRenderer = ({
  kind,
  profile,
  selectedMediasIds,
  onStockMediaSelect,
}: StockMediaListGridRendererProps) => {
  const { data, hasNext, isLoadingNext, loadNext } = usePaginationFragment(
    kind === 'image' ? stockImageFragment : stockVideoFragment,
    profile,
  );

  const onEndReached = useCallback(() => {
    if (hasNext && !isLoadingNext) {
      loadNext(52);
    }
  }, [hasNext, isLoadingNext, loadNext]);

  const { width: windowWidth } = useWindowDimensions();
  const medias = useMemo<Array<StockPhoto | StockVideo>>(() => {
    if (!data) {
      return [];
    }
    if ('searchStockPhotos' in data && data.searchStockPhotos) {
      return (data.searchStockPhotos.edges ?? [])
        .map(edge => edge?.node)
        .filter(item => !!item);
    }
    if ('searchStockVideos' in data && data.searchStockVideos) {
      return (data.searchStockVideos.edges ?? [])
        .map(edge => edge?.node)
        .filter(item => !!item);
    }

    return [];
  }, [data]);

  return (
    <MediaGridList
      medias={medias}
      selectedMediaIds={selectedMediasIds}
      filesDownloading={null}
      refreshing={false}
      isLoadingMore={isLoadingNext}
      numColumns={4}
      width={windowWidth}
      getItemId={getItemId}
      getItemUri={getItemUri}
      getItemDuration={getItemDuration}
      onSelect={onStockMediaSelect}
      onEndReached={onEndReached}
      testID="photo-gallery-list"
    />
  );
};

type StockPhoto = {
  readonly __typename: 'StockImage';
  readonly author: string | null;
  readonly height: number;
  readonly id: string;
  readonly url: string;
  readonly thumbnail: string;
  readonly width: number;
};

type StockVideo = {
  readonly __typename: 'StockVideo';
  readonly author: string | null;
  readonly duration: number;
  readonly height: number;
  readonly id: string;
  readonly thumbnail: string;
  readonly url: string;
  readonly width: number;
};

const getItemId = (item: StockPhoto | StockVideo) => item.id;

const getItemUri = (item: StockPhoto | StockVideo) => item.thumbnail;

const getItemDuration = (item: StockPhoto | StockVideo) =>
  item.__typename === 'StockImage' ? undefined : item.duration;

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 10, gap: 10 },
  searchBar: { marginHorizontal: 20 },
  pexelsLink: {
    position: 'absolute',
    bottom: 10,
    left: 20,
  },
});
