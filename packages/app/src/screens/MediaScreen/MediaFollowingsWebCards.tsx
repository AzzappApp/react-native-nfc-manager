import { useMemo, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import CoverList from '#components/CoverList';
import Link from '#components/Link';
import Button from '#ui/Button';
import type { CoverList_users$key } from '#relayArtifacts/CoverList_users.graphql';
import type { MediaFollowingsWebCards_webCard$key } from '#relayArtifacts/MediaFollowingsWebCards_webCard.graphql';
import type { StyleProp, ViewStyle } from 'react-native';

type MediaFollowingsWebCardsProps = {
  webCard: MediaFollowingsWebCards_webCard$key;
  style?: StyleProp<ViewStyle>;
  header?: React.ReactNode;
};

const MediaFollowingsWebCards = ({
  webCard,
  style,
  header,
}: MediaFollowingsWebCardsProps) => {
  const { data, loadNext, hasNext, isLoadingNext } = usePaginationFragment(
    graphql`
      fragment MediaFollowingsWebCards_webCard on WebCard
      @refetchable(queryName: "MediaFollowingsWebCardsListQuery")
      @argumentDefinitions(
        after: { type: String }
        first: { type: Int, defaultValue: 6 }
      ) {
        followings(after: $after, first: $first)
          @connection(key: "WebCards_followings") {
          edges {
            node {
              ...CoverList_users
            }
          }
        }
      }
    `,
    webCard,
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
        <View style={styles.seeAll}>
          <Link route="FOLLOWINGS_MOSAIC">
            <Button
              variant="little_round"
              label={intl.formatMessage({
                defaultMessage: 'See all',
                description: 'See all followed profiles',
              })}
            />
          </Link>
        </View>
      </View>
    </View>
  ) : null;
};

export default MediaFollowingsWebCards;

const styles = StyleSheet.create({
  containerStyle: {
    paddingHorizontal: 8,
    paddingBottom: 20,
    paddingTop: 16.5,
  },
  coverStyle: { width: 80 },
  seeAll: {
    position: 'absolute',
    right: 12,
    top: 60.5,
  },
});
