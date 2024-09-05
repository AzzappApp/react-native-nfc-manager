import { memo } from 'react';
import { FormattedMessage } from 'react-intl';
import { View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import CoverLinkRenderer from '#components/CoverLink/CoverLinkRenderer';
import Link from '#components/Link';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useToggleFollow from '#hooks/useToggleFollow';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { PostLikesListItem_webCard$key } from '#relayArtifacts/PostLikesListItem_webCard.graphql';

type Props = {
  webcard: PostLikesListItem_webCard$key;
};

const PostLikesListItem = ({ webcard: webcardKey }: Props) => {
  const webCard = useFragment(
    graphql`
      fragment PostLikesListItem_webCard on WebCard
      @argumentDefinitions(viewerWebCardId: { type: "ID" }) {
        id
        userName
        cardIsPublished
        isFollowing(webCardId: $viewerWebCardId)
        ...CoverRenderer_webCard
      }
    `,
    webcardKey,
  );

  const toggleFollow = useToggleFollow();
  const onToggleFollow = () => {
    toggleFollow(webCard.id, webCard.userName, !webCard.isFollowing);
  };

  const styles = useStyleSheet(stylesheet);

  return (
    <View style={styles.item}>
      <Link
        disabled={webCard.cardIsPublished === false}
        route="WEBCARD"
        params={{ userName: webCard.userName, webCardId: webCard.id }}
      >
        <View style={styles.content}>
          <PressableNative style={styles.profile}>
            <CoverLinkRenderer
              webCard={webCard}
              width={COVER_WIDTH}
              webCardId={webCard.id}
              userName={webCard.userName}
              canPlay={false}
            />
            <View>
              <Text variant="large" numberOfLines={1}>
                {webCard.userName}
              </Text>
            </View>
          </PressableNative>
          <PressableNative onPress={onToggleFollow}>
            {!webCard.isFollowing && (
              <Text variant="button">
                <FormattedMessage
                  defaultMessage="Follow"
                  description="Follow from post likes screen"
                />
              </Text>
            )}
            {webCard.isFollowing && (
              <Text variant="button" style={styles.unfollow}>
                <FormattedMessage
                  defaultMessage="Unfollow"
                  description="Unfollow from post likes screen"
                />
              </Text>
            )}
          </PressableNative>
        </View>
      </Link>
    </View>
  );
};

const COVER_WIDTH = 35;

const stylesheet = createStyleSheet(theme => ({
  item: {
    paddingRight: 10,
    columnGap: 15.5,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  profile: {
    paddingLeft: 20.5,
    columnGap: 15.5,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unfollow: {
    color: theme === 'light' ? '#C8C7CA' : '#54535B',
  },
}));

export default memo(PostLikesListItem);
