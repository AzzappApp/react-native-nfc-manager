import * as Sentry from '@sentry/react-native';
import { Paths, File, Directory } from 'expo-file-system/next';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  View,
  useWindowDimensions,
  Share,
  Platform,
  Alert,
} from 'react-native';
import ShareCommand from 'react-native-share';
import Toast from 'react-native-toast-message';
import { graphql, useFragment } from 'react-relay';
import { useDebouncedCallback } from 'use-debounce';
import ERRORS from '@azzapp/shared/errors';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import { colors, shadow } from '#theme';
import CoverRenderer from '#components/CoverRenderer';
import { useRouter } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useQuitWebCard from '#hooks/useQuitWebCard';
import { useSendReport } from '#hooks/useSendReport';
import ActivityIndicator from '#ui/ActivityIndicator';
import { DelayedActivityIndicator } from '#ui/ActivityIndicator/ActivityIndicator';
import BottomSheetModal from '#ui/BottomSheetModal';
import Container from '#ui/Container';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { WebCardMenu_webCard$key } from '#relayArtifacts/WebCardMenu_webCard.graphql';

type WebCardMenuProps = {
  close: () => void;
  /**
   *
   *
   * @type {WebCardMenu_webCard$key}
   */
  webCard: WebCardMenu_webCard$key;
  /**
   *
   *
   * @type {boolean}
   */
  isViewer: boolean;
  /**
   * true when the viewer the owner of the webCard
   */
  isOwner: boolean;
  /*
   * is admin of the webcard
   */
  isAdmin: boolean;
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

const WebCardMenu = ({
  webCard: webCardKey,
  onToggleFollow,
  visible,
  close,
  isViewer,
  isOwner,
  isAdmin,
}: WebCardMenuProps) => {
  const webCard = useFragment(
    graphql`
      fragment WebCardMenu_webCard on WebCard
      @argumentDefinitions(viewerWebCardId: { type: "ID" }) {
        id
        userName
        nbPosts
        nbFollowers
        nbFollowings
        cardIsPublished
        coverMedia {
          __typename
          id
          uriDownload: uri
        }
        WebCardMenu_isFollowing: isFollowing(webCardId: $viewerWebCardId)
        ...CoverRenderer_webCard
      }
    `,
    webCardKey,
  );
  const isFollowing = webCard.WebCardMenu_isFollowing;

  const { width: windowsWith } = useWindowDimensions();
  const intl = useIntl();

  const onShare = async () => {
    if (!webCard.userName) {
      Sentry.captureMessage('null username in WebCardMenu / onShare');
      return;
    }
    // a quick share method using the native share component. If we want to make a custom share (like tiktok for example, when they are recompressiong the media etc) we can use react-native-shares
    const url = buildUserUrl(webCard.userName);
    let message = intl.formatMessage({
      defaultMessage: 'Check out this azzapp WebCard: ',
      description:
        'Profile WebCardMenu, message use when sharing the contact card',
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
              'Profile WebCardMenu, message use when sharing the contact card',
          }),
          message,
          url,
        },
        {
          dialogTitle: intl.formatMessage({
            defaultMessage: 'Azzapp | An app made for your business',
            description:
              'Profile WebCardMenu, message use when sharing the contact card',
          }),
          subject: intl.formatMessage({
            defaultMessage: 'Azzapp | An app made for your business',
            description:
              'Profile WebCardMenu, message use when sharing the contact card',
          }),
        },
      );
    } catch (error: any) {
      Sentry.captureException(error);
    }
  };

  const [coverVideoLoading, setCoverVideoLoading] = useState(false);
  const cancelCoverVideoDownloadRef = useRef<(() => void) | null>(null);

  const onShareCoverVideo = useCallback(async () => {
    if (!webCard.coverMedia?.uriDownload || coverVideoLoading) {
      return;
    }
    setCoverVideoLoading(true);
    let file;
    try {
      //download the coverurl locally
      const directory = new Directory(
        `${Paths.cache.uri}/${webCard.coverMedia.id}`,
      );
      if (!directory.exists) {
        directory.create();
      }
      const filePath = `${directory.uri}/${webCard.userName}.mp4`;
      file = new File(filePath);

      if (!file.exists) {
        await File.downloadFileAsync(webCard.coverMedia.uriDownload, file);
      }
    } catch (error) {
      console.warn('error during cover sharing', error);

      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Error while downloading the media',
          description:
            'Error toast message when downloading the media fails during the video share',
        }),
      });

      return;
    } finally {
      setCoverVideoLoading(false);
    }

    try {
      await ShareCommand.open({
        url: file?.uri,
        type:
          webCard.coverMedia.__typename === 'MediaVideo'
            ? 'video/mp4'
            : 'image/png',
        failOnCancel: false,
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Error while sharing the media',
          description:
            'Error toast message when sharing the media fails during the video share',
        }),
      });
    }
  }, [
    webCard.coverMedia?.uriDownload,
    webCard.coverMedia?.id,
    webCard.coverMedia?.__typename,
    webCard.userName,
    coverVideoLoading,
    intl,
  ]);

  useEffect(() => {
    if (!visible) {
      cancelCoverVideoDownloadRef.current?.();
    }
  }, [visible]);

  const debouncedToggleFollowing = useDebouncedCallback(() => {
    if (!webCard.userName) {
      Sentry.captureMessage('null username in WebCardMenu / onToggleFollow');
      return;
    }
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
          text1: intl.formatMessage(
            {
              defaultMessage: 'You have already reported this WebCard{azzappA}',
              description:
                'Info toast message when sending report on webCard is already done.',
            },
            {
              azzappA: <Text variant="azzapp">a</Text>,
            },
          ) as unknown as string,
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
      router.backToTop();
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
          text1: intl.formatMessage(
            {
              defaultMessage:
                'Oops, quitting this WebCard{azzappA} was not possible. Please try again later.',
              description: 'Error toast message when quitting WebCard',
            },
            {
              azzappA: <Text variant="azzapp">a</Text>,
            },
          ) as unknown as string,
        });
      }
    },
  );

  const handleConfirmationQuitWebCard = useCallback(() => {
    const titleMsg = isOwner
      ? intl.formatMessage({
          defaultMessage: 'Delete this WebCard',
          description: 'Delete WebCard title',
        })
      : intl.formatMessage({
          defaultMessage: 'Quit this WebCard',
          description: 'Quit WebCard title',
        });

    const descriptionMsg = isOwner
      ? intl.formatMessage({
          defaultMessage:
            'Are you sure you want to delete this WebCard and all its contents? This action is irreversible.',
          description: 'Delete WebCard confirmation message',
        })
      : intl.formatMessage({
          defaultMessage:
            'Are you sure you want to quit this WebCard? This action is irreversible.',
          description: 'Quit WebCard confirmation message',
        });

    const labelConfirmation = isOwner
      ? intl.formatMessage({
          defaultMessage: 'Delete this WebCard',
          description: 'Delete button label',
        })
      : intl.formatMessage({
          defaultMessage: 'Quit this WebCard',
          description: 'Quit button label',
        });

    Alert.alert(titleMsg, descriptionMsg, [
      {
        text: intl.formatMessage({
          defaultMessage: 'Cancel',
          description: 'Cancel button label',
        }),
        style: 'cancel',
      },
      {
        text: labelConfirmation,
        style: 'destructive',
        onPress: quitWebCard,
      },
    ]);
  }, [intl, isOwner, quitWebCard]);

  return (
    <BottomSheetModal visible={visible} onDismiss={close}>
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
          style={styles.headerBottom}
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
              canPlay={false}
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
          {isViewer && isAdmin && (
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
          {isViewer && isAdmin && (
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
          {webCard.cardIsPublished && webCard.userName && (
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
                      description="Profile webcard modal - Share this Webcard"
                      values={{
                        azzappA: <Text variant="azzapp">a</Text>,
                      }}
                    />
                  </Text>
                </View>
              </View>
            </PressableNative>
          )}
          {isViewer && webCard.cardIsPublished && (
            <PressableNative
              style={styles.bottomSheetOptionButton}
              onPress={onShareCoverVideo}
            >
              <View style={styles.bottomSheetOptionContainer}>
                <View style={styles.bottomSheetOptionIconLabel}>
                  <Icon icon="video_film" />
                  <Text>
                    {webCard.coverMedia?.__typename === 'MediaVideo' ? (
                      <FormattedMessage
                        defaultMessage="Share this cover video"
                        description="Profile webcard modal - Share this video"
                      />
                    ) : (
                      <FormattedMessage
                        defaultMessage="Share this cover image"
                        description="Profile webcard modal - Share this image"
                      />
                    )}
                  </Text>
                  {coverVideoLoading && (
                    <DelayedActivityIndicator
                      delay={300}
                      style={styles.loader}
                    />
                  )}
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
                    defaultMessage="Report this WebCard{azzappA}"
                    description="Label for the button to report a webCard"
                    values={{
                      azzappA: (
                        <Text variant="azzapp" style={styles.deleteButton}>
                          a
                        </Text>
                      ),
                    }}
                  />
                </Text>
              )}
            </PressableNative>
          )}
        </View>
        {isViewer && (
          <PressableNative
            onPress={handleConfirmationQuitWebCard}
            style={[styles.bottomSheetOptionButton, styles.report]}
            disabled={isLoadingQuitWebCard}
          >
            <Text variant="error">
              {isOwner ? (
                <FormattedMessage
                  defaultMessage="Delete this WebCard{azzappA}"
                  description="label for button to delete a webcard"
                  values={{
                    azzappA: (
                      <Text variant="azzapp" style={styles.deleteButton}>
                        a
                      </Text>
                    ),
                  }}
                />
              ) : (
                <FormattedMessage
                  defaultMessage="Quit this WebCard{azzappA}"
                  description="label for button to quit a webcard (multi-user)"
                  values={{
                    azzappA: (
                      <Text style={styles.deleteButton} variant="azzapp">
                        a
                      </Text>
                    ),
                  }}
                />
              )}
            </Text>
          </PressableNative>
        )}
      </Container>
    </BottomSheetModal>
  );
};

export default memo(WebCardMenu);

const stylesheet = createStyleSheet(appearance => ({
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
  deleteButton: { color: colors.red400 },
  coverStyle: {
    ...shadow(appearance, 'bottom'),
  },
  loader: { height: 25 },
  headerBottom: { paddingLeft: 16, paddingRight: 16 },
}));
