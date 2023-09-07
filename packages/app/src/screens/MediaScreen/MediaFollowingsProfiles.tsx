import { useMemo, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import CoverList from '#components/CoverList';
import Link from '#components/Link';
import Button from '#ui/Button';
import type { CoverList_users$key } from '@azzapp/relay/artifacts/CoverList_users.graphql';
import type { MediaFollowingsProfiles_viewer$key } from '@azzapp/relay/artifacts/MediaFollowingsProfiles_viewer.graphql';
import type { StyleProp, ViewStyle } from 'react-native';

type MediaFollowingsProfilesProps = {
  viewer: MediaFollowingsProfiles_viewer$key;
  style?: StyleProp<ViewStyle>;
  header?: React.ReactNode;
};

const MediaFollowingsProfiles = ({
  viewer,
  style,
  header,
}: MediaFollowingsProfilesProps) => {
  const { data, loadNext, hasNext, isLoadingNext } = usePaginationFragment(
    graphql`
      fragment MediaFollowingsProfiles_viewer on Viewer
      @refetchable(queryName: "MediaFollowingsProfilesListQuery")
      @argumentDefinitions(
        after: { type: String }
        first: { type: Int, defaultValue: 6 }
      ) {
        followings(after: $after, first: $first)
          @connection(key: "Viewer_followings") {
          edges {
            node {
              ...CoverList_users
            }
          }
        }
      }
    `,
    viewer,
  );

  const users: CoverList_users$key = useMemo(() => {
    return convertToNonNullArray(
      data.followings?.edges?.map(edge => edge?.node) ?? [],
    );
  }, [data.followings?.edges]);

  const onEndReached = useCallback(() => {
    if (!isLoadingNext && hasNext) {
      loadNext(10);
    }
  }, [isLoadingNext, hasNext, loadNext]);

  const intl = useIntl();

  return users?.length ? (
    <View>
      {header}
      <View>
        <CoverList
          users={users}
          onEndReached={onEndReached}
          containerStyle={styles.containerStyle}
          coverStyle={styles.coverStyle}
          initialNumToRender={10}
          withShadow
          style={style}
        />
        <Link route="FOLLOWINGS_MOSAIC">
          <Button
            variant="little_round"
            label={intl.formatMessage({
              defaultMessage: 'See all',
              description: 'See all followed profiles',
            })}
            style={styles.seeAll}
          />
        </Link>
      </View>
    </View>
  ) : null;
};

export default MediaFollowingsProfiles;

const styles = StyleSheet.create({
  containerStyle: {
    paddingHorizontal: 8,
  },
  coverStyle: { width: 80 },
  seeAll: {
    position: 'absolute',
    right: 12,
    top: 44,
  },
});
