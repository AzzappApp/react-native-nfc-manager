import * as Sentry from '@sentry/react-native';
import { memo } from 'react';
import { FormattedMessage } from 'react-intl';
import { View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import CoverRenderer from '#components/CoverRenderer';
import Link from '#components/Link';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { profileInfoHasAdminRight } from '#helpers/profileRoleHelper';
import { useProfileInfos } from '#hooks/authStateHooks';
import useToggleFollow from '#hooks/useToggleFollow';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { PostLikesListItem_webCard$key } from '#relayArtifacts/PostLikesListItem_webCard.graphql';

type Props = {
  webcard: PostLikesListItem_webCard$key;
};

const PostLikesListItem = ({ webcard: webcardKey }: Props) => {
  const profileInfos = useProfileInfos();
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
    if (!webCard.userName) {
      Sentry.captureMessage(
        'null username in PostLikesListItem / onToggleFollow',
      );
      return;
    }
    toggleFollow(webCard.id, webCard.userName, !webCard.isFollowing);
  };

  const styles = useStyleSheet(stylesheet);

  return (
    <View style={styles.item}>
      <View style={styles.content}>
        <Link
          route="WEBCARD"
          disabled={webCard.cardIsPublished === false}
          params={{ webCardId: webCard.id }}
        >
          <PressableNative style={styles.profile}>
            <CoverRenderer
              webCard={webCard}
              width={COVER_WIDTH}
              canPlay={false}
            />
            <View>
              <Text variant="large" numberOfLines={1}>
                {webCard.userName}
              </Text>
            </View>
          </PressableNative>
        </Link>
        {profileInfoHasAdminRight(profileInfos) &&
          profileInfos?.webCardId !== webCard.id &&
          webCard.userName && (
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
          )}
      </View>
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
    color: theme === 'light' ? colors.grey200 : colors.grey800,
  },
}));

export default memo(PostLikesListItem);
