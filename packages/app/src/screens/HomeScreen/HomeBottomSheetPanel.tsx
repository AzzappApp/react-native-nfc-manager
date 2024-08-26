import * as Sentry from '@sentry/react-native';
import { useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  Platform,
  StyleSheet,
  View,
  Share,
  Alert,
  Linking,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import {
  profileHasAdminRight,
  profileIsOwner,
} from '@azzapp/shared/profileHelpers';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import Link from '#components/Link';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import useQuitWebCard from '#hooks/useQuitWebCard';
import useScreenInsets from '#hooks/useScreenInsets';
import useToggle from '#hooks/useToggle';
import BottomSheetModal from '#ui/BottomSheetModal';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { LinkProps } from '#components/Link';
import type { HomeBottomSheetPanel_profile$key } from '#relayArtifacts/HomeBottomSheetPanel_profile.graphql';
import type { Icons } from '#ui/Icon';
import type { ReactNode } from 'react';

type HomeBottomSheetPanelProps = {
  /**
   *
   *
   * @type {boolean}
   */
  visible: boolean;
  /**
   * Close modal
   *
   */
  close: () => void;

  profile?: HomeBottomSheetPanel_profile$key | null;

  userIsPremium?: boolean | null;
};

const HomeBottomSheetPanel = ({
  visible,
  close,
  profile: profileKey,
  userIsPremium,
}: HomeBottomSheetPanelProps) => {
  const profile = useFragment(
    graphql`
      fragment HomeBottomSheetPanel_profile on Profile {
        id
        profileRole
        webCard {
          id
          userName
          cardIsPublished
          hasCover
          requiresSubscription
          isPremium
          isWebSubscription
        }
        invited
      }
    `,
    profileKey ?? null,
  );

  const intl = useIntl();

  const [quitWebCard, isLoadingQuitWebCard] = useQuitWebCard(
    profile?.webCard?.id,
    close,
    e => {
      console.error(e);
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
        ) as string,
      });
    },
  );

  const handleConfirmationQuitWebCard = useCallback(() => {
    const isOwner = profileIsOwner(profile?.profileRole);

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
  }, [intl, profile?.profileRole, quitWebCard]);

  const { bottom } = useScreenInsets();
  const [requestedLogout, toggleRequestLogout] = useToggle(false);

  //this code work on ios only
  const onDismiss = () => {
    if (requestedLogout) {
      void dispatchGlobalEvent({ type: 'SIGN_OUT' });
    }
  };
  //TODO: review Using onDismiss to logout (strange) but without it, the app is crashing in dev
  const onLogout = useCallback(async () => {
    if (Platform.OS === 'ios') {
      toggleRequestLogout();
    }
    close();
    if (Platform.OS === 'android') {
      //android is not crashing, but onDismiss is an ios feature only
      void dispatchGlobalEvent({ type: 'SIGN_OUT' });
    }
  }, [close, toggleRequestLogout]);

  const onShare = useCallback(async () => {
    if (profile?.webCard?.userName) {
      // a quick share method using the native share component. If we want to make a custom share (like tiktok for example, when they are recompressiong the media etc) we can use react-native-shares
      const url = buildUserUrl(profile?.webCard.userName);
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
        close();

        //TODO: handle result of the share when specified
      } catch (error: any) {
        Sentry.captureException(error);
      }
    }
  }, [close, intl, profile?.webCard?.userName]);

  //Restore purchase
  //Manage my subsciption
  const elements = useMemo<
    Array<HomeBottomSheetPanelOptionProps | { type: 'separator' }>
  >(
    () =>
      convertToNonNullArray([
        !userIsPremium && profile?.webCard && !profile.webCard.isPremium
          ? {
              type: 'row',
              icon: 'plus',
              text: intl.formatMessage({
                defaultMessage: 'Upgrade to Azzapp PRO',
                description:
                  'Link to open upgrade to Azzapp PRO form to change webcard parameters',
              }),
              linkProps: {
                route: 'USER_PAY_WALL',
              },
              onPress: close,
            }
          : null,
        {
          type: 'row',
          icon: 'information',
          text: intl.formatMessage({
            defaultMessage: 'Account details',
            description:
              'Link to open account details form to change email, phone number, etc.',
          }),
          linkProps: {
            route: 'ACCOUNT_DETAILS',
          },
          onPress: close,
        },
        profile?.webCard?.isPremium && !profile?.webCard.isWebSubscription
          ? {
              type: 'row',
              icon: Platform.OS === 'ios' ? 'app_store' : 'play_store',
              text: intl.formatMessage({
                defaultMessage: 'Manage my subscription',
                description:
                  'Link to manage my subscription form to change webcard parameters',
              }),
              linkProps: {
                route: 'USER_PAY_WALL',
              },
              onPress: close,
            }
          : null,
        { type: 'separator' },
        profileHasAdminRight(profile?.profileRole) && !profile?.invited
          ? {
              type: 'row',
              icon: 'parameters',
              text: intl.formatMessage(
                {
                  defaultMessage: 'WebCard{azzappA} parameters',
                  description:
                    'Link to open webcard parameters form to change webcard parameters',
                },
                { azzappA: <Text variant="azzapp">a</Text> },
              ),
              linkProps: {
                route: 'WEBCARD_PARAMETERS',
              },
              onPress: close,
            }
          : null,
        !profile?.invited &&
        profileHasAdminRight(profile?.profileRole) &&
        profile?.webCard?.hasCover
          ? {
              type: 'row',
              icon: 'shared_webcard',
              text: intl.formatMessage({
                defaultMessage: 'Multi user',
                description: 'Multi user menu option',
              }),
              linkProps: {
                route: 'MULTI_USER',
              },
              onPress: close,
            }
          : null,
        profile && profile?.webCard?.cardIsPublished && !profile?.invited
          ? {
              type: 'row',
              icon: 'share',
              text: intl.formatMessage(
                {
                  defaultMessage: 'Share this WebCard{azzappApp}',
                  description: 'Share this webcard',
                },
                { azzappApp: <Text variant="azzapp">a</Text> },
              ),
              onPress: onShare,
            }
          : null,
        { type: 'separator' },
        !profile?.invited
          ? {
              type: 'row',
              icon: 'invite',
              text: intl.formatMessage({
                defaultMessage: 'Invite friends',
                description: 'Invite friends to join the app',
              }),
              linkProps: {
                route: 'INVITE_FRIENDS',
              },
              onPress: close,
            }
          : null,
        {
          type: 'row',
          icon: 'contact_us',
          text: intl.formatMessage({
            defaultMessage: 'Contact us',
            description: 'Contact us message in Home bottom sheet panel',
          }),
          onPress: () => {
            Linking.openURL('mailto:support@azzapp.com');
          },
        },
        {
          type: 'row',
          icon: 'about',
          text: intl.formatMessage({
            defaultMessage: 'About',
            description: 'About message item in Home bottom sheet panel',
          }),
          linkProps: {
            route: 'ABOUT',
          },
          onPress: close,
        },
        {
          type: 'row',
          icon: 'logout',
          text: intl.formatMessage({
            defaultMessage: 'Logout',
            description: 'logout link',
          }),
          onPress: onLogout,
        },
      ]),
    [close, intl, onLogout, onShare, profile, userIsPremium],
  );

  const modalHeight = useMemo(() => {
    const separatorHeight =
      elements.filter(element => element.type === 'separator').length * 25;
    const rowHeight =
      elements.filter(element => element.type === 'row').length *
      (ROW_HEIGHT + 10);
    return 20 + rowHeight + separatorHeight + 30;
  }, [elements]);

  return (
    <BottomSheetModal
      visible={visible}
      height={bottom + modalHeight}
      contentContainerStyle={styles.bottomSheetContainer}
      onDismiss={onDismiss}
      onRequestClose={close}
    >
      <View style={styles.bottomSheetOptionsContainer}>
        {elements.map((element, index) => {
          if (element.type === 'separator') {
            return <View key={`separator_${index}`} style={styles.separator} />;
          }
          return <HomeBottomSheetPanelOption key={index} {...element} />;
        })}
        {profile && !profileIsOwner(profile?.profileRole) && (
          <PressableNative
            style={styles.removeButton}
            onPress={handleConfirmationQuitWebCard}
            disabled={isLoadingQuitWebCard}
          >
            <Text variant="button" style={styles.removeText}>
              <FormattedMessage
                defaultMessage="Quit this WebCard{azzappA}"
                description="label for button to quit a webcard (multi-user)"
                values={{
                  azzappA: (
                    <Text style={styles.removeText} variant="azzapp">
                      a
                    </Text>
                  ),
                }}
              />
            </Text>
          </PressableNative>
        )}
      </View>
    </BottomSheetModal>
  );
};

type HomeBottomSheetPanelOptionProps =
  | {
      type: 'row';
      icon: Icons;
      text: ReactNode;
      linkProps?: LinkProps<any>;
      onPress: () => void;
    }
  | {
      type: 'separator';
    };

const HomeBottomSheetPanelOption = ({
  icon,
  text,
  linkProps,
  onPress,
}: {
  type: 'row';
  icon: Icons;
  text: ReactNode;
  linkProps?: LinkProps<any>;
  onPress: () => void;
}) => {
  const inner = (
    <PressableNative style={styles.bottomSheetOptionButton} onPress={onPress}>
      <View style={styles.bottomSheetOptionContainer}>
        <View style={styles.bottomSheetOptionIconLabel}>
          <Icon icon={icon} />
          <Text>{text}</Text>
        </View>
        <Icon icon="arrow_right" />
      </View>
    </PressableNative>
  );
  if (linkProps) {
    return <Link {...linkProps}>{inner}</Link>;
  }
  return inner;
};

const ROW_HEIGHT = 42;
const styles = StyleSheet.create({
  separator: { height: 25 },
  bottomSheetContainer: {
    marginTop: 10,
    paddingHorizontal: 0,
  },
  bottomSheetOptionsContainer: {
    paddingTop: 20,
  },
  bottomSheetOptionButton: {
    paddingVertical: 5,
    paddingHorizontal: 20,
    height: ROW_HEIGHT,
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
  removeButton: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  removeText: {
    color: colors.red400,
  },
});

export default HomeBottomSheetPanel;
