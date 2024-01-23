import * as Sentry from '@sentry/react-native';
import { memo, useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Platform, StyleSheet, View, Share } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { isAdmin } from '@azzapp/shared/profileHelpers';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import Link from '#components/Link';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
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
  /**
   * User has a profile
   */
  withProfile: boolean;
  /**
   * The profile role of the active webCard / profile
   *
   * @type {(string | null)}
   */
  profileRole: string | null;

  profile?: HomeBottomSheetPanel_profile$key | null;
};

const HomeBottomSheetPanel = ({
  visible,
  close,
  profileRole,
  withProfile,
  profile: profileKey,
}: HomeBottomSheetPanelProps) => {
  const profile = useFragment(
    graphql`
      fragment HomeBottomSheetPanel_profile on Profile {
        id
        webCard {
          userName
          cardIsPublished
        }
        invited
      }
    `,
    profileKey ?? null,
  );

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

  const intl = useIntl();
  const onShare = useCallback(async () => {
    if (profile?.webCard.userName) {
      // a quick share method using the native share component. If we want to make a custom share (like tiktok for example, when they are recompressiong the media etc) we can use react-native-shares
      try {
        await Share.share(
          {
            url: buildUserUrl(profile?.webCard.userName),
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
  }, [close, intl, profile?.webCard.userName]);

  const elements = useMemo<HomeBottomSheetPanelOptionProps[]>(
    () =>
      convertToNonNullArray([
        {
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
        withProfile && profileRole && isAdmin(profileRole) && !profile?.invited
          ? {
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
        withProfile &&
        profile &&
        profile?.webCard.cardIsPublished &&
        !profile?.invited
          ? {
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

        withProfile && !profile?.invited
          ? {
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

        withProfile && profileRole && !profile?.invited && isAdmin(profileRole)
          ? {
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
        {
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
          icon: 'logout',
          text: intl.formatMessage({
            defaultMessage: 'Logout',
            description: 'logout link',
          }),
          onPress: onLogout,
        },
      ]),
    [close, intl, onLogout, onShare, profile, profileRole, withProfile],
  );

  const modalHeight = 20 + 32 * elements.length + 20 * (elements.length - 1);

  return (
    <BottomSheetModal
      visible={visible}
      height={bottom + modalHeight}
      contentContainerStyle={styles.bottomSheetContainer}
      onDismiss={onDismiss}
      onRequestClose={close}
    >
      <View style={styles.bottomSheetOptionsContainer}>
        {elements.map((element, index) => (
          <HomeBottomSheetPanelOption key={index} {...element} />
        ))}
      </View>
    </BottomSheetModal>
  );
};

type HomeBottomSheetPanelOptionProps = {
  icon: Icons;
  text: ReactNode;
  linkProps?: LinkProps<any>;
  onPress: () => void;
};

const HomeBottomSheetPanelOption = ({
  icon,
  text,
  linkProps,
  onPress,
}: HomeBottomSheetPanelOptionProps) => {
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

const styles = StyleSheet.create({
  bottomSheetContainer: {
    marginTop: 10,
    paddingHorizontal: 0,
  },
  bottomSheetOptionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    rowGap: 20,
  },
  bottomSheetOptionButton: {
    height: 32,
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
});

export default memo(HomeBottomSheetPanel);
