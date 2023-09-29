import { Suspense } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { useDebouncedCallback } from 'use-debounce';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import useScreenInsets from '#hooks/useScreenInsets';
import FloatingButton from '#ui/FloatingButton';
import FloatingIconButton from '#ui/FloatingIconButton';
import Text from '#ui/Text';
import { useEditTransition } from './ProfileScreenTransitions';
import type { ProfileScreenButtonBar_profile$key } from '@azzapp/relay/artifacts/ProfileScreenButtonBar_profile.graphql';
import type { ViewProps } from 'react-native';

type ProfileScreenButtonBarProps = ViewProps & {
  /**
   * The current displayed profile
   */
  profile: ProfileScreenButtonBar_profile$key;
  /**
   * true if the profile is the current user
   */
  isViewer: boolean;
  /**
   *  true when the webcard is visible (as opposite of displaying the post list)
   */
  isWebCardDisplayed: boolean;
  /**
   * If the card is in editing mode
   */
  editing: boolean;
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
  onToggleFollow: (
    profileId: string,
    userName: string,
    follow: boolean,
  ) => void;
  /**
   * A callback called when the user press flip button
   */
  onFlip?: () => void;
  /**
   * A callback called when the user press the more ... button
   */
  onShowWebcardModal: () => void;
};

/**
 * The button bar displayed at the bottom of the profile screen
 * Responsible for retrieving the profile following status and displaying the follow button
 * if the profile is not the current user, and the edit button if the profile is the current user
 */
const ProfileScreenButtonBar = ({
  profile,
  editing,
  isViewer,
  onEdit,
  onHome,
  onToggleFollow,
  onShowWebcardModal,
  onFlip,
  isWebCardDisplayed,
  style,
  ...props
}: ProfileScreenButtonBarProps) => {
  const inset = useScreenInsets();
  const editTransition = useEditTransition();
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        editTransition?.value ?? 0,
        [0, 0.2, 0.8, 1],
        [1, 0.1, 0.0, 0],
      ),
    };
  }, [editTransition?.value]);

  return (
    <Animated.View
      style={[styles.buttonBar, animatedStyle, { bottom: inset.bottom }, style]}
      {...props}
      pointerEvents={editing ? 'none' : 'box-none'}
    >
      <FloatingIconButton
        icon="azzapp"
        onPress={onHome}
        iconSize={26}
        iconStyle={{ tintColor: colors.white }}
        variant="grey"
      />
      <Suspense
        fallback={
          <FloatingButton
            variant="grey"
            style={styles.mainButton}
            accessible={false}
          />
        }
      >
        <ProfileScreenButtonActionButton
          profile={profile}
          isViewer={isViewer}
          onEdit={onEdit}
          isWebCardDisplayed={isWebCardDisplayed}
          onToggleFollow={onToggleFollow}
          onShowWebcardModal={onShowWebcardModal}
        />
      </Suspense>
      <FloatingIconButton
        icon="flip"
        iconSize={26}
        iconStyle={{ tintColor: colors.white }}
        variant="grey"
        style={styles.userPostsButton}
        onPress={onFlip}
      />
    </Animated.View>
  );
};

export default ProfileScreenButtonBar;

type ProfileScreenButtonActionButtonProps = {
  profile: ProfileScreenButtonBar_profile$key;
  isViewer: boolean;
  isWebCardDisplayed: boolean;
  onEdit: () => void;
  onToggleFollow: (
    profileId: string,
    userName: string,
    follow: boolean,
  ) => void;
  /**
   * A callback called when the user press the more ... button
   */
  onShowWebcardModal: () => void;
};

const ProfileScreenButtonActionButton = ({
  profile: profileKey,
  isViewer,
  isWebCardDisplayed,
  onEdit,
  onToggleFollow,
  onShowWebcardModal,
}: ProfileScreenButtonActionButtonProps) => {
  const profile = useFragment(
    graphql`
      fragment ProfileScreenButtonBar_profile on Profile {
        id
        userName
        isFollowing
      }
    `,
    profileKey,
  );

  const debouncedToggleFollowing = useDebouncedCallback(() => {
    onToggleFollow(profile.id, profile.userName, !profile.isFollowing);
  }, 600);

  const intl = useIntl();

  const router = useRouter();
  const onCreateNewPost = () => {
    router.push({ route: 'NEW_POST', params: { fromProfile: true } });
  };

  return isViewer ? (
    isWebCardDisplayed ? (
      <FloatingButton
        onPress={onEdit}
        style={styles.mainButton}
        variant="grey"
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Tap to edit your profile',
          description: 'ProfileScreenButtonBar edit button accessibility label',
        })}
      >
        <Text variant="button" style={styles.textButton}>
          <FormattedMessage
            defaultMessage="Build my webcard"
            description="Build my webcard button label in Profile Screen Button Bar"
          />
        </Text>
      </FloatingButton>
    ) : (
      <FloatingButton
        variant="grey"
        onPress={onCreateNewPost}
        style={styles.mainButton}
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Tap to create a new post',
          description: 'ProfileScreenButtonBar edit button accessibility label',
        })}
      >
        <Text variant="button" style={styles.textButton}>
          <FormattedMessage
            defaultMessage="Create a new post"
            description="Profile post create a new post"
          />
        </Text>
      </FloatingButton>
    )
  ) : (
    <View style={{ flexDirection: 'row', flex: 1 }}>
      <FloatingButton
        onPress={debouncedToggleFollowing}
        style={styles.mainButton}
        variant="grey"
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Tap to follow the profile',
          description: 'UserScreenButtonBar follow profile accessibility label',
        })}
      >
        <Text variant="button" style={styles.textButton}>
          {profile.isFollowing ? (
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
      <FloatingIconButton
        icon="more"
        variant="grey"
        onPress={onShowWebcardModal}
        iconStyle={{ tintColor: colors.white }}
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Tap to show the webcard informations',
          description:
            'ProfileScreenButtonBar show webcard informations button accessibility label',
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  buttonBar: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    width: '100%',
    paddingHorizontal: 15,
    zIndex: 999,
  },
  textButton: { color: colors.white },
  mainButton: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  userPostsButton: {
    marginLeft: 10,
  },
});
