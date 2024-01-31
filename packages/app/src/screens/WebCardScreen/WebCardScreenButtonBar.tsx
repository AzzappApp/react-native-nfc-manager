import { Suspense } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Alert, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

import Toast from 'react-native-toast-message';
import { graphql, useFragment } from 'react-relay';
import { useDebouncedCallback } from 'use-debounce';
import { isEditor } from '@azzapp/shared/profileHelpers';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import useAuthState from '#hooks/useAuthState';
import useScreenInsets from '#hooks/useScreenInsets';
import BlurredFloatingButton, {
  BlurredFloatingIconButton,
} from '#ui/BlurredFloatingButton';
import FloatingButton from '#ui/FloatingButton';
import Text from '#ui/Text';
import { useEditTransition } from './WebCardScreenTransitions';
import type { WebCardScreenButtonBar_myWebCard$key } from '#relayArtifacts/WebCardScreenButtonBar_myWebCard.graphql';
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
  userWebCard: WebCardScreenButtonBar_myWebCard$key;
  /**
   * true if the webCard is the current user
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
  userWebCard,
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
}: WebCardScreenButtonBarProps) => {
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
          userWebCard={userWebCard}
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
        style={styles.userPostsButton}
        onPress={onFlip}
      />
    </Animated.View>
  );
};

export default WebCardScreenButtonBar;

type ProfileScreenButtonActionButtonProps = {
  webCard: WebCardScreenButtonBar_webCard$key;
  userWebCard: WebCardScreenButtonBar_myWebCard$key;
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
  userWebCard: userWebCardKey,
  isViewer,
  isWebCardDisplayed,
  onEdit,
  onToggleFollow,
  onShowWebcardModal,
}: ProfileScreenButtonActionButtonProps) => {
  const { cardIsPublished } = useFragment(
    graphql`
      fragment WebCardScreenButtonBar_myWebCard on WebCard {
        id
        cardIsPublished
      }
    `,
    userWebCardKey,
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

  const { profileInfos } = useAuthState();
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
          onPress: () => {
            router.back();
          },
        },
      ],
    );
  };

  const onShowWebcardModalCallback = () => {
    if (cardIsPublished) {
      onShowWebcardModal();
    } else {
      showWebcardUnpublishAlert();
    }
  };

  const debouncedToggleFollowing = useDebouncedCallback(() => {
    if (!cardIsPublished) {
      showWebcardUnpublishAlert();
      return;
    }

    if (profileInfos?.profileRole && isEditor(profileInfos.profileRole)) {
      onToggleFollow(webCard.id, webCard.userName, !isFollowing);
    } else if (isFollowing) {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Only admins & editors can stop following a WebCard',
          description:
            'Error message when trying to unfollow a WebCard without being an admin',
        }),
      });
    } else {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Only admins & editors can follow a WebCard',
          description:
            'Error message when trying to follow a WebCard without being an admin',
        }),
      });
    }
  }, 600);

  const onCreateNewPost = () => {
    if (profileInfos?.profileRole && isEditor(profileInfos?.profileRole)) {
      router.push({ route: 'NEW_POST', params: { fromProfile: true } });
    } else {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Only admins & editors can create a post',
          description:
            'Error message when trying to create a post without being an admin',
        }),
      });
    }
  };

  return isViewer ? (
    isWebCardDisplayed ? (
      <BlurredFloatingButton
        onPress={onEdit}
        style={styles.mainButton}
        variant="grey"
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Tap to edit your WebCard',
          description: 'ProfileScreenButtonBar edit button accessibility label',
        })}
      >
        <Text variant="button" style={styles.textButton}>
          <FormattedMessage
            defaultMessage="Build my webcard"
            description="Build my webcard button label in Profile Screen Button Bar"
          />
        </Text>
      </BlurredFloatingButton>
    ) : (
      <BlurredFloatingButton
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
