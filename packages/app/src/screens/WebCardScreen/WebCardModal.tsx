import * as Sentry from '@sentry/react-native';
import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, useWindowDimensions, Share, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { graphql, useFragment } from 'react-relay';
import { useDebouncedCallback } from 'use-debounce';
import ERRORS from '@azzapp/shared/errors';
import { isAdmin } from '@azzapp/shared/profileHelpers';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import { colors, shadow } from '#theme';
import CoverRenderer from '#components/CoverRenderer';
import { useRouter } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useAuthState from '#hooks/useAuthState';
import useQuitWebCard from '#hooks/useQuitWebCard';
import { useSendReport } from '#hooks/useSendReport';
import ActivityIndicator from '#ui/ActivityIndicator';
import BottomSheetModal from '#ui/BottomSheetModal';
import Container from '#ui/Container';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { WebCardModal_webCard$key } from '#relayArtifacts/WebCardModal_webCard.graphql';

type WebCardModalProps = {
  close: () => void;
  /**
   *
   *
   * @type {WebCardModal_webCard$key}
   */
  webCard: WebCardModal_webCard$key;
  /**
   *
   *
   * @type {boolean}
   */
  isViewer: boolean;
  /**
   *
   *
   * @type {boolean}
   */
  visible: boolean;
  /**
   * callback to follow/unfollow
   *
   */
  onToggleFollow: (
    webCardId: string,
    userName: string,
    follow: boolean,
  ) => void;
};

const WebCardModal = ({
  webCard: webCardKey,
  onToggleFollow,
  visible,
  close,
  isViewer,
}: WebCardModalProps) => {
  const webCard = useFragment(
    graphql`
      fragment WebCardModal_webCard on WebCard
      @argumentDefinitions(viewerWebCardId: { type: "ID" }) {
        id
        userName
        nbPosts
        nbFollowers
        nbFollowings
        cardIsPublished
        webCardModal_isFollowing: isFollowing(webCardId: $viewerWebCardId)
        ...CoverRenderer_webCard
      }
    `,
    webCardKey,
  );
  const isFollowing = webCard.webCardModal_isFollowing;
  const { profileInfos } = useAuthState();

  const { width: windowsWith, height: windowsHeight } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  const intl = useIntl();

  const onShare = async () => {
    // a quick share method using the native share component. If we want to make a custom share (like tiktok for example, when they are recompressiong the media etc) we can use react-native-shares
    const url = buildUserUrl(webCard.userName);
    let message = intl.formatMessage({
      defaultMessage: 'Check out this azzapp WebCard: ',
      description:
        'Profile WebcardModal, message use when sharing the contact card',
    });
    if (Platform.OS === 'android') {
      // for android we need to add the message to the share
      message = `${message} ${url}`;
    }
    try {
      await Share.share(
        {
          title: intl.formatMessage({
            defaultMessage: 'WebCard on azzapp',
            description:
              'Profile WebcardModal, message use when sharing the contact card',
          }),
          message,
          url,
        },
        {
          dialogTitle: intl.formatMessage({
            defaultMessage: 'Azzapp | An app made for your business',
            description:
              'Profile WebcardModal, message use when sharing the contact card',
          }),
          subject: intl.formatMessage({
            defaultMessage: 'Azzapp | An app made for your business',
            description:
              'Profile WebcardModal, message use when sharing the contact card',
          }),
        },
      );
      //TODO: handle result of the share when specified
    } catch (error: any) {
      Sentry.captureException(error);
    }
  };

  const debouncedToggleFollowing = useDebouncedCallback(() => {
    onToggleFollow(webCard.id, webCard.userName, !isFollowing);
  }, 600);

  const styles = useStyleSheet(stylesheet);

  const [sendReport, commitSendReportLoading] = useSendReport(
    webCard.id,
    ({ sendReport }) => {
      if (sendReport.created) {
        Toast.show({
          type: 'success',
          text1: intl.formatMessage({
            defaultMessage: 'Report on webCard sent',
            description: 'Success toast message when sending report succeeds.',
          }),
          onHide: close,
        });
      } else {
        Toast.show({
          type: 'info',
          text1: intl.formatMessage({
            defaultMessage: 'You already reported this webCard',
            description:
              'Info toast message when sending report on webCard is already done.',
          }),
          onHide: close,
        });
      }
    },
    () =>
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Error while sending the report, please try again.',
          description: 'Error toast message when sending report fails.',
        }),
      }),
  );

  const router = useRouter();
  const onWebCardParameters = useCallback(() => {
    close();
    router.push({
      route: 'WEBCARD_PARAMETERS',
    });
  }, [close, router]);

  const onMultiUser = useCallback(() => {
    close();
    router.push({
      route: 'MULTI_USER',
    });
  }, [router, close]);

  const [quitWebCard, isLoadingQuitWebCard] = useQuitWebCard(
    webCard.id,
    () => {
      close();
      router.back();
    },
    e => {
      if (e.message === ERRORS.SUBSCRIPTION_IS_ACTIVE) {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage:
              "You have an active subscription on this WebCard. You can't delete it.",
            description:
              'Error toast message when quitting WebCard with an active subscription',
          }),
        });
      } else {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: "Error, couldn't quit WebCard. Please try again.",
            description: 'Error toast message when quitting WebCard',
          }),
        });
      }
    },
  );

  return (
    <BottomSheetModal
      height={Math.min(600, windowsHeight - top + 50)}
      visible={visible}
      onRequestClose={close}
      contentContainerStyle={styles.bottomSheetContentContainer}
    >
      <Container>
        <Header
          leftElement={
            <IconButton
              icon="arrow_down"
              onPress={close}
              iconSize={28}
              variant="icon"
            />
          }
          middleElement={<Text variant="large">{webCard.userName}</Text>}
          rightElement={null}
        />
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 20,
          }}
        >
          <View style={styles.coverStyle}>
            <CoverRenderer
              webCard={webCard}
              width={windowsWith / 3}
              animationEnabled={false}
            />
          </View>
        </View>
        <View style={styles.countersContainer}>
          <View style={styles.counterContainer}>
            <Text variant="xlarge">{webCard?.nbPosts}</Text>
            <Text variant="small" style={styles.counterValue} numberOfLines={1}>
              <FormattedMessage
                defaultMessage="Posts"
                description="Number of posts"
              />
            </Text>
          </View>

          <View style={styles.counterContainer}>
            <Text variant="xlarge">{webCard?.nbFollowers}</Text>
            <Text variant="small" style={styles.counterValue} numberOfLines={1}>
              <FormattedMessage
                defaultMessage="Followers"
                description="Number of followers"
              />
            </Text>
          </View>
          <View style={styles.counterContainer}>
            <Text variant="xlarge">{webCard?.nbFollowings}</Text>
            <Text variant="small" style={styles.counterValue} numberOfLines={1}>
              <FormattedMessage
                defaultMessage="Followings"
                description="Number of followed webcards"
              />
            </Text>
          </View>
        </View>
        <View style={styles.bottomSheetOptionsContainer}>
          {isViewer && isAdmin(profileInfos?.profileRole) && (
            <PressableNative
              style={styles.bottomSheetOptionButton}
              onPress={onWebCardParameters}
            >
              <View style={styles.bottomSheetOptionIconLabel}>
                <Icon icon="parameters" />
                <Text>
                  <FormattedMessage
                    defaultMessage="WebCard{azzappA} parameters"
                    description="Link to open webcard parameters form to change webcard parameters in the webcard modal screen"
                    values={{
                      azzappA: <Text variant="azzapp">a</Text>,
                    }}
                  />
                </Text>
              </View>
            </PressableNative>
          )}
          {isViewer && isAdmin(profileInfos?.profileRole) && (
            <PressableNative
              style={styles.bottomSheetOptionButton}
              onPress={onMultiUser}
            >
              <View style={styles.bottomSheetOptionIconLabel}>
                <Icon icon="shared_webcard" />
                <Text>
                  <FormattedMessage
                    defaultMessage="Multi user"
                    description="Link to open the multi user panel in the webcard modal screen"
                  />
                </Text>
              </View>
            </PressableNative>
          )}
          {webCard.cardIsPublished && (
            <PressableNative
              style={styles.bottomSheetOptionButton}
              onPress={onShare}
            >
              <View style={styles.bottomSheetOptionContainer}>
                <View style={styles.bottomSheetOptionIconLabel}>
                  <Icon icon="share" />
                  <Text>
                    <FormattedMessage
                      defaultMessage="Share this Webcard{azzappA}"
                      description="Profile webcard modal - Share thie Webcard"
                      values={{
                        azzappA: <Text variant="azzapp">a</Text>,
                      }}
                    />
                  </Text>
                </View>
              </View>
            </PressableNative>
          )}
          {!isViewer && (
            <PressableNative
              style={styles.bottomSheetOptionButton}
              onPress={debouncedToggleFollowing}
            >
              <View style={styles.bottomSheetOptionIconLabel}>
                <Icon icon={isFollowing ? 'delete_filled' : 'add_circle'} />
                <Text>
                  {isFollowing ? (
                    <FormattedMessage
                      defaultMessage="Unfollow"
                      description="Unfollow button label in Profile webcard modal Button"
                    />
                  ) : (
                    <FormattedMessage
                      defaultMessage="Follow"
                      description="Follow button label in Profile webcard modal Button"
                    />
                  )}
                </Text>
              </View>
            </PressableNative>
          )}
          {!isViewer && (
            <PressableNative
              onPress={sendReport}
              style={[styles.bottomSheetOptionButton, styles.report]}
              disabled={commitSendReportLoading}
            >
              {commitSendReportLoading ? (
                <ActivityIndicator color="black" />
              ) : (
                <Text variant="error">
                  <FormattedMessage
                    defaultMessage="Report this webCard"
                    description="Label for the button to report a webCard"
                  />
                </Text>
              )}
            </PressableNative>
          )}
        </View>
        {isViewer && (
          <PressableNative
            onPress={quitWebCard}
            style={[styles.bottomSheetOptionButton, styles.report]}
            disabled={isLoadingQuitWebCard}
          >
            <Text variant="error">
              <FormattedMessage
                defaultMessage="Delete this WebCard{azzappA}"
                description="PostItem Modal - Delete this post"
                values={{
                  azzappA: (
                    <Text variant="azzapp" style={{ color: colors.red400 }}>
                      a
                    </Text>
                  ),
                }}
              />
            </Text>
          </PressableNative>
        )}
      </Container>
    </BottomSheetModal>
  );
};

export default WebCardModal;

const stylesheet = createStyleSheet(appearance => ({
  bottomSheetContentContainer: { paddingHorizontal: 0 },
  countersContainer: {
    flexDirection: 'row',
    columnGap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: colors.grey100,
    height: 60,
  },
  bottomSheetOptionsContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
    rowGap: 20,
  },
  counterContainer: { width: 12, alignItems: 'center', flex: 1 },
  counterValue: {
    color: colors.grey400,
  },
  bottomSheetOptionButton: {
    height: 32,
  },
  report: {
    marginVertical: 10,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  bottomSheetOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  bottomSheetOptionIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },

  coverStyle: {
    ...shadow(appearance, 'bottom'),
  },
}));
