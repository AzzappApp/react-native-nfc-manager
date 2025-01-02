import { Suspense, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Alert, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useFragment } from 'react-relay';
import { useDebouncedCallback } from 'use-debounce';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import { logEvent } from '#helpers/analytics';
import { getAuthState } from '#helpers/authStore';
import { profileInfoHasEditorRight } from '#helpers/profileRoleHelper';
import useScreenInsets from '#hooks/useScreenInsets';
import BlurredFloatingButton, {
  BlurredFloatingIconButton,
} from '#ui/BlurredFloatingButton';
import FloatingButton from '#ui/FloatingButton';
import Text from '#ui/Text';
import type { WebCardScreenButtonBar_profile$key } from '#relayArtifacts/WebCardScreenButtonBar_profile.graphql';
import type { WebCardScreenButtonBar_webCard$key } from '#relayArtifacts/WebCardScreenButtonBar_webCard.graphql';
import type { ViewProps } from 'react-native';

type WebCardScreenButtonBarProps = ViewProps & {
  /**
   * The current displayed webCard
   */
  webCard: WebCardScreenButtonBar_webCard$key;
  /**
   * The current user  webCard
   */
  profile: WebCardScreenButtonBar_profile$key;
  /**
   * true if the webCard is the current user
   */
  isViewer: boolean;
  /**
   *  true when the webcard is visible (as opposite of displaying the post list)
   */
  isWebCardDisplayed: boolean;
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
    webCardId: string,
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
 * The button bar displayed at the bottom of the webCard screen
 * Responsible for retrieving the webCard following status and displaying the follow button
 * if the webCard is not the current user, and the edit button if the webCard is the current user
 */
const WebCardScreenButtonBar = ({
  webCard,
  profile,
  isViewer,
  onEdit,
  onHome,
  onToggleFollow,
  onShowWebcardModal,
  onFlip,
  isWebCardDisplayed,
  style,
  ...props
}: WebCardScreenButtonBarProps) => {
  const inset = useScreenInsets();

  return (
    <View
      style={[styles.buttonBar, { bottom: inset.bottom }, style]}
      {...props}
    >
      <BlurredFloatingIconButton
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
        <WebCardScreenButtonActionButton
          webCard={webCard}
          profile={profile}
          isViewer={isViewer}
          onEdit={onEdit}
          isWebCardDisplayed={isWebCardDisplayed}
          onToggleFollow={onToggleFollow}
          onShowWebcardModal={onShowWebcardModal}
        />
      </Suspense>
      <BlurredFloatingIconButton
        icon="flip"
        iconSize={26}
        iconStyle={{ tintColor: colors.white }}
        variant="grey"
        style={styles.auxiliaryButton}
        onPress={onFlip}
      />
    </View>
  );
};

export default WebCardScreenButtonBar;

type ProfileScreenButtonActionButtonProps = {
  webCard: WebCardScreenButtonBar_webCard$key;
  profile: WebCardScreenButtonBar_profile$key;
  isViewer: boolean;
  isWebCardDisplayed: boolean;
  onEdit: () => void;
  onToggleFollow: (
    webCardId: string,
    userName: string,
    follow: boolean,
  ) => void;
  /**
   * A callback called when the user press the more ... button
   */
  onShowWebcardModal: () => void;
};

const WebCardScreenButtonActionButton = ({
  webCard: webCardKey,
  profile: profileKey,
  isViewer,
  isWebCardDisplayed,
  onEdit,
  onToggleFollow,
  onShowWebcardModal,
}: ProfileScreenButtonActionButtonProps) => {
  const profile = useFragment(
    graphql`
      fragment WebCardScreenButtonBar_profile on Profile {
        webCard {
          id
          cardIsPublished
        }
        invited
      }
    `,
    profileKey,
  );

  const webCard = useFragment(
    graphql`
      fragment WebCardScreenButtonBar_webCard on WebCard
      @argumentDefinitions(viewerWebCardId: { type: "ID" }) {
        id
        userName
        webCardScreenButtonBar_isFollowing: isFollowing(
          webCardId: $viewerWebCardId
        )
      }
    `,
    webCardKey,
  );
  const isFollowing = webCard.webCardScreenButtonBar_isFollowing;

  const intl = useIntl();

  const router = useRouter();
  const showWebcardUnpublishAlert = () => {
    Alert.alert(
      intl.formatMessage({
        defaultMessage: 'Unpublished WebCard.',
        description:
          'PostList - Alert Message title when the user is viewing a post (from deeplinking) with an unpublished WebCard',
      }),
      intl.formatMessage({
        defaultMessage:
          'This action can only be done from a published WebCard.',
        description:
          'PostList - AlertMessage when the user is viewing a post (from deeplinking) with an unpublished WebCard',
      }),
      [
        {
          text: intl.formatMessage({
            defaultMessage: 'Ok',
            description:
              'PostList - Alert button when the user is viewing a post (from deeplinking) with an unpublished WebCard',
          }),
        },
      ],
    );
  };

  const onShowWebcardModalCallback = () => {
    if (profile.webCard?.cardIsPublished || isViewer) {
      onShowWebcardModal();
    } else {
      showWebcardUnpublishAlert();
    }
  };

  const debouncedToggleFollowing = useDebouncedCallback(() => {
    if (!profile.webCard?.cardIsPublished) {
      showWebcardUnpublishAlert();
      return;
    }

    if (profile.invited) {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage:
            'Oops, first you must accept the pending invitation to join the WebCard',
          description:
            'WebCardScreenButtonBar - Error message when trying to follow/unfollow a WebCard from an invited webcard',
        }),
      });
      return;
    }
    const { profileInfos } = getAuthState();
    if (profileInfoHasEditorRight(profileInfos)) {
      onToggleFollow(webCard.id, webCard.userName, !isFollowing);
    } else if (isFollowing) {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Your role does not permit this action',
          description:
            'Error message when trying to unfollow a WebCard without being an admin',
        }),
      });
    } else {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Your role does not permit this action',
          description:
            'Error message when trying to follow a WebCard without being an admin',
        }),
      });
    }
  }, 600);

  const onCreateNewPost = useCallback(() => {
    const { profileInfos } = getAuthState();
    if (profileInfoHasEditorRight(profileInfos)) {
      logEvent('create_post', { source: 'webcard' });
      router.push({ route: 'NEW_POST', params: { fromProfile: true } });
    } else {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Your role does not permit this action',
          description:
            'Error message when trying to create a post without being an admin',
        }),
      });
    }
  }, [intl, router]);

  return isViewer ? (
    isWebCardDisplayed ? (
      <>
        <BlurredFloatingButton
          onPress={onEdit}
          style={styles.mainButton}
          variant="grey"
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Tap to edit your WebCard',
            description:
              'ProfileScreenButtonBar edit button accessibility label',
          })}
        >
          <Text variant="button" style={styles.textButton}>
            <FormattedMessage
              defaultMessage="Build my WebCard{azzappA}"
              description="Build my webcard button label in Profile Screen Button Bar"
              values={{
                azzappA: (
                  <Text variant="azzapp" style={styles.textButton}>
                    a
                  </Text>
                ),
              }}
            />
          </Text>
        </BlurredFloatingButton>
        <BlurredFloatingIconButton
          icon="more"
          variant="grey"
          onPress={onShowWebcardModalCallback}
          style={styles.auxiliaryButton}
          iconStyle={{ tintColor: colors.white }}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Tap to show the WebCard information',
            description:
              'ProfileScreenButtonBar show webcard informations button accessibility label',
          })}
        />
      </>
    ) : (
      <BlurredFloatingButton
        variant="grey"
        onPress={onCreateNewPost}
        style={styles.mainButton}
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Tap to edit your WebCard',
          description: 'ProfileScreenButtonBar edit button accessibility label',
        })}
      >
        <Text variant="button" style={styles.textButton}>
          <FormattedMessage
            defaultMessage="Create a new post"
            description="Profile post create a new post"
          />
        </Text>
      </BlurredFloatingButton>
    )
  ) : (
    <View style={{ flexDirection: 'row', flex: 1 }}>
      <BlurredFloatingButton
        onPress={debouncedToggleFollowing}
        style={styles.mainButton}
        variant="grey"
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Tap to follow the WebCard',
          description: 'UserScreenButtonBar follow WebCard accessibility label',
        })}
      >
        <Text variant="button" style={styles.textButton}>
          {isFollowing ? (
            <FormattedMessage
              defaultMessage="Unfollow"
              description="Unfollow button label in WebCard Screen Button Bar"
            />
          ) : (
            <FormattedMessage
              defaultMessage="Follow"
              description="Follow button label in WebCard Screen Button Bar"
            />
          )}
        </Text>
      </BlurredFloatingButton>
      <BlurredFloatingIconButton
        icon="more"
        variant="grey"
        onPress={onShowWebcardModalCallback}
        iconStyle={{ tintColor: colors.white }}
        style={styles.auxiliaryButton}
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
  },
  auxiliaryButton: {
    marginLeft: 10,
  },
});
