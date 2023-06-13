import { Suspense, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, useLazyLoadQuery } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { colors } from '#theme';
import Link from '#components/Link';
import useToggle from '#hooks/useToggle';
import FloatingButton from '#ui/FloatingButton';
import FloatingIconButton from '#ui/FloatingIconButton';
import Text from '#ui/Text';
import type { ProfileScreenButtonBarQuery } from '@azzapp/relay/artifacts/ProfileScreenButtonBarQuery.graphql';
import type { ViewProps } from 'react-native';

type ProfileScreenButtonBarProps = ViewProps & {
  /**
   * The user name of the current displayed profile
   */
  userName: string;
  /**
   * A callback called when the user press the edit button
   */
  onEdit: () => void;
  /**
   * A callback called when the user press the home button
   */
  onHome: () => void;
  /**
   * A callback called when the user press the follow button
   */
  onToggleFollow: (follow: boolean) => void;
};

/**
 * The button bar displayed at the bottom of the profile screen
 * Responsible for retrieving the profile following status and displaying the follow button
 * if the profile is not the current user, and the edit button if the profile is the current user
 */
const ProfileScreenButtonBar = ({
  userName,
  onEdit,
  onHome,
  onToggleFollow,
  style,
  ...props
}: ProfileScreenButtonBarProps) => {
  return (
    <View style={[styles.buttonBar, style]} {...props}>
      <FloatingIconButton
        icon="azzapp"
        onPress={onHome}
        iconSize={26}
        iconStyle={{ tintColor: colors.white }}
        variant="grey"
      />
      <Suspense
        fallback={
          <View style={[styles.mainButton, styles.mainButtonFallback]} />
        }
      >
        <ProfileScreenButtonActionButton
          userName={userName}
          onEdit={onEdit}
          onHome={onHome}
          onToggleFollow={onToggleFollow}
        />
      </Suspense>
      <Link route="PROFILE_POSTS" params={{ userName }}>
        <FloatingIconButton
          icon="flip"
          iconSize={26}
          iconStyle={{ tintColor: colors.white }}
          variant="grey"
          style={styles.userPostsButton}
        />
      </Link>
    </View>
  );
};

export default ProfileScreenButtonBar;

const ProfileScreenButtonActionButton = ({
  userName,
  onEdit,
  onToggleFollow,
}: ProfileScreenButtonBarProps) => {
  const { profile, viewer } = useLazyLoadQuery<ProfileScreenButtonBarQuery>(
    graphql`
      query ProfileScreenButtonBarQuery($userName: String!) {
        profile(userName: $userName) {
          isFollowing
        }
        viewer {
          profile {
            userName
          }
        }
      }
    `,
    { userName },
  );

  const canEdit = userName === viewer.profile?.userName;

  const [isFollowing, toggleFollowing] = useToggle(
    Boolean(profile?.isFollowing),
  );

  const [debouncedIsFollowing] = useDebounce(isFollowing, 600);

  useEffect(() => {
    if (debouncedIsFollowing !== Boolean(profile?.isFollowing)) {
      onToggleFollow(debouncedIsFollowing);
    }
  }, [debouncedIsFollowing, onToggleFollow, profile?.isFollowing]);

  const intl = useIntl();
  return canEdit ? (
    <FloatingButton
      onPress={onEdit}
      style={styles.mainButton}
      accessibilityLabel={intl.formatMessage({
        defaultMessage: 'Tap to edit your profile',
        description: 'UserScreenButtonBar edit button accessibility label',
      })}
    >
      <Text variant="button">
        <FormattedMessage
          defaultMessage="Build my webcard"
          description="Build my webcard button label in Profile Screen Button Bar"
        />
      </Text>
    </FloatingButton>
  ) : (
    <FloatingButton
      onPress={toggleFollowing}
      style={styles.mainButton}
      accessibilityLabel={intl.formatMessage({
        defaultMessage: 'Tap to follow the profile',
        description: 'UserScreenButtonBar follow profile accessibility label',
      })}
    >
      <Text variant="button">
        {isFollowing ? (
          <FormattedMessage
            defaultMessage="Unfollow"
            description="Unfollow button label in Profile Screen Button Bar"
          />
        ) : (
          <FormattedMessage
            defaultMessage="Follow"
            description="Follow button label in Profile Screen Button Bar"
          />
        )}
      </Text>
    </FloatingButton>
  );
};

const styles = StyleSheet.create({
  buttonBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainButton: {
    flex: 1,
    marginLeft: 15,
  },
  mainButtonFallback: {
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  userPostsButton: {
    marginLeft: 15,
  },
});
