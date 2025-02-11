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
import { profileIsOwner } from '@azzapp/shared/profileHelpers';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import { ENABLE_MULTI_USER } from '#Config';
import { signInRoutes } from '#mobileRoutes';
import { colors } from '#theme';
import Link from '#components/Link';
import { useRouter } from '#components/NativeRouter';
import { logEvent } from '#helpers/analytics';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import {
  profileInfoHasAdminRight,
  profileInfoIsOwner,
} from '#helpers/profileRoleHelper';
import { useDeleteNotifications } from '#hooks/useNotifications';
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

  const { bottom } = useScreenInsets();
  const intl = useIntl();
  const deleteFcmToken = useDeleteNotifications();

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
        ) as unknown as string,
      });
    },
  );

  const handleConfirmationQuitWebCard = useCallback(() => {
    const isOwner = profileInfoIsOwner(profile);

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
  }, [intl, profile, quitWebCard]);

  const [requestedLogout, toggleRequestLogout] = useToggle(false);

  const router = useRouter();

  const onDismiss = useCallback(async () => {
    if (requestedLogout) {
      setTimeout(() => {
        try {
          deleteFcmToken();
        } finally {
          void dispatchGlobalEvent({ type: 'SIGN_OUT' });
        }
      });
    }
    close();
  }, [close, deleteFcmToken, requestedLogout]);

  const onLogout = useCallback(async () => {
    router.replaceAll(signInRoutes);
    toggleRequestLogout();
    close();
  }, [close, router, toggleRequestLogout]);

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
        logEvent('share_webcard', { source: 'home' });
        close();

        //TODO: handle result of the share when specified
      } catch (error: any) {
        Sentry.captureException(error);
      }
    }
  }, [close, intl, profile?.webCard?.userName]);

  //Restore purchase
  //Manage my subscription
  const elements = useMemo<
    Array<HomeBottomSheetPanelOptionProps | { type: 'separator' }>
  >(
    () =>
      convertToNonNullArray([
        !userIsPremium &&
        profile?.webCard &&
        !profile.webCard.isPremium &&
        ENABLE_MULTI_USER
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
        {
          type: 'row',
          icon: 'offline',
          text: intl.formatMessage({
            defaultMessage: 'Offline mode',
            description: 'Link to open offline mode ',
          }),
          linkProps: {
            route: 'OFFLINE_VCARD',
            params: { canGoBack: true },
          },
          onPress: () => {
            logEvent('open_webcard_parameters', { source: 'home' });
            close();
          },
        },
        profile?.webCard?.isPremium &&
        !profile?.webCard.isWebSubscription &&
        profileIsOwner(profile.profileRole) &&
        ENABLE_MULTI_USER
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
        profileInfoHasAdminRight(profile)
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
              onPress: () => {
                logEvent('open_webcard_parameters', { source: 'home' });
                close();
              },
            }
          : null,
        !profile?.invited &&
        profileInfoHasAdminRight(profile) &&
        profile?.webCard?.hasCover &&
        ENABLE_MULTI_USER
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
              onPress: () => {
                logEvent('open_multi_user', { source: 'home' });
                close();
              },
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
              onPress: () => {
                logEvent('invite_friend', { source: 'home' });
                close();
              },
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
            logEvent('open_mail_support');
            Linking.openURL('mailto:support@azzapp.com');
          },
        },
        {
          type: 'row',
          icon: 'help',
          text: intl.formatMessage({
            defaultMessage: 'Help center',
            description: 'Help center us message in Home bottom sheet panel',
          }),
          onPress: () => {
            Linking.openURL(process.env.FAQ || '');
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

  const hasQuitWebcard = profile && !profileInfoIsOwner(profile);

  const height = useMemo(() => {
    const QUIT_WEBCARD_HEIGHT = hasQuitWebcard ? 30 : 0;

    return elements.reduce(
      (accumulator, currentValue) => {
        if (currentValue.type === 'separator') {
          accumulator += SEPARATOR_HEIGHT;
        } else {
          accumulator += ELEMENT_HEIGHT;
        }

        return accumulator;
      },
      bottom + HANDLE_HEIGHT + QUIT_WEBCARD_HEIGHT,
    );
  }, [bottom, elements, hasQuitWebcard]);

  return (
    <BottomSheetModal
      index={0}
      visible={visible}
      onDismiss={onDismiss}
      enablePanDownToClose
      height={height}
    >
      {elements.map((element, index) => {
        if (element.type === 'separator') {
          return <View key={`separator_${index}`} style={styles.separator} />;
        }
        return <HomeBottomSheetPanelOption key={index} {...element} />;
      })}
      {hasQuitWebcard && (
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

const SEPARATOR_HEIGHT = 25;
const ELEMENT_HEIGHT = 42;
const HANDLE_HEIGHT = 50;

const ROW_HEIGHT = 42;
const styles = StyleSheet.create({
  separator: { height: 25 },
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
