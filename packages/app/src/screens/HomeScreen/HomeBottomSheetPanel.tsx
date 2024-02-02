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
          cardCover {
            segmented #segmented is the only mandatory field in a card Cover
          }
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

  const elements = useMemo<
    Array<HomeBottomSheetPanelOptionProps | { type: 'separator' }>
  >(
    () =>
      convertToNonNullArray([
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
        { type: 'separator' },
        withProfile && profileRole && isAdmin(profileRole) && !profile?.invited
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
        withProfile &&
        profile &&
        profile?.webCard.cardIsPublished &&
        !profile?.invited
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

        withProfile && !profile?.invited
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
        { type: 'separator' },
        withProfile &&
        profileRole &&
        !profile?.invited &&
        isAdmin(profileRole) &&
        profile?.webCard.cardCover
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
    [close, intl, onLogout, onShare, profile, profileRole, withProfile],
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
});

export default memo(HomeBottomSheetPanel);
