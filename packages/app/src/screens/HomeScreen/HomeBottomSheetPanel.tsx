import * as Sentry from '@sentry/react-native';
import { memo, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Platform, StyleSheet, View, Share } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { isAdmin, isOwner } from '@azzapp/shared/profileHelpers';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import Link from '#components/Link';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import useScreenInsets from '#hooks/useScreenInsets';
import useToggle from '#hooks/useToggle';
import BottomSheetModal from '#ui/BottomSheetModal';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { HomeBottomSheetPanel_profile$key } from '@azzapp/relay/artifacts/HomeBottomSheetPanel_profile.graphql';

type HomeBottomSheetPanel = {
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

  profile?: HomeBottomSheetPanel_profile$key | null;
};

const HomeBottomSheetPanel = ({
  visible,
  close,
  withProfile,
  profile: profileKey,
}: HomeBottomSheetPanel) => {
  const profile = useFragment(
    graphql`
      fragment HomeBottomSheetPanel_profile on Profile {
        id
        profileRole
        webCard {
          userName
          cardIsPublished
        }
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
  const onShare = async () => {
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
  };
  const profileRole = profile?.profileRole;

  const modalHeight = useMemo(() => {
    let height = 270;

    if (!withProfile || !profileRole) return height;

    if (isOwner(profileRole)) height += 50;
    if (isAdmin(profileRole)) height += 50;

    return height;
  }, [profileRole, withProfile]);

  return (
    <BottomSheetModal
      visible={visible}
      height={bottom + modalHeight}
      contentContainerStyle={styles.bottomSheetContainer}
      onDismiss={onDismiss}
      onRequestClose={close}
    >
      <View style={styles.bottomSheetOptionsContainer}>
        <>
          <Link route="ACCOUNT_DETAILS">
            <PressableNative
              style={styles.bottomSheetOptionButton}
              onPress={close}
            >
              <View style={styles.bottomSheetOptionContainer}>
                <View style={styles.bottomSheetOptionIconLabel}>
                  <Icon icon="information" />
                  <Text>
                    <FormattedMessage
                      defaultMessage="Account details"
                      description="Link to open account details form to change email, phone number, etc."
                    />
                  </Text>
                </View>
                <Icon icon="arrow_right" />
              </View>
            </PressableNative>
          </Link>
          {withProfile && profileRole && isOwner(profileRole) && (
            <Link route="WEBCARD_PARAMETERS">
              <PressableNative
                style={styles.bottomSheetOptionButton}
                onPress={close}
              >
                <View style={styles.bottomSheetOptionContainer}>
                  <View style={styles.bottomSheetOptionIconLabel}>
                    <Icon icon="parameters" />
                    <Text>
                      <FormattedMessage
                        defaultMessage="WebCard{azzappA} parameters"
                        description="Link to open webcard parameters form to change webcard parameters"
                        values={{
                          azzappA: <Text variant="azzapp">a</Text>,
                        }}
                      />
                    </Text>
                  </View>
                  <Icon icon="arrow_right" />
                </View>
              </PressableNative>
            </Link>
          )}
          {withProfile && profile && profile?.webCard.cardIsPublished && (
            <PressableNative
              style={styles.bottomSheetOptionButton}
              onPress={onShare}
            >
              <View style={styles.bottomSheetOptionContainer}>
                <View style={styles.bottomSheetOptionIconLabel}>
                  <Icon icon="share" />
                  <Text>
                    <FormattedMessage
                      defaultMessage="Share this WebCard{azzappApp}"
                      description="Share this webcard"
                      values={{ azzappApp: <Text variant="azzapp">a</Text> }}
                    />
                  </Text>
                </View>
                <Icon icon="arrow_right" />
              </View>
            </PressableNative>
          )}
          {withProfile ? (
            <Link route="INVITE_FRIENDS">
              <PressableNative
                style={styles.bottomSheetOptionButton}
                onPress={close}
              >
                <View style={styles.bottomSheetOptionContainer}>
                  <View style={styles.bottomSheetOptionIconLabel}>
                    <Icon icon="invite" />
                    <Text>
                      <FormattedMessage
                        defaultMessage="Invite friends"
                        description="Invite friends to join the app"
                      />
                    </Text>
                  </View>
                  <Icon icon="arrow_right" />
                </View>
              </PressableNative>
            </Link>
          ) : null}
          {withProfile && profileRole && isAdmin(profileRole) ? (
            <Link route="MULTI_USER">
              <PressableNative
                style={styles.bottomSheetOptionButton}
                onPress={close}
              >
                <View style={styles.bottomSheetOptionContainer}>
                  <View style={styles.bottomSheetOptionIconLabel}>
                    <Icon icon="shared_webcard" />
                    <Text>
                      <FormattedMessage
                        defaultMessage="Multi user"
                        description="Multi user menu option"
                      />
                    </Text>
                  </View>
                  <Icon icon="arrow_right" />
                </View>
              </PressableNative>
            </Link>
          ) : null}
        </>
        <Link route="ABOUT">
          <PressableNative
            style={styles.bottomSheetOptionButton}
            onPress={close}
          >
            <View style={styles.bottomSheetOptionContainer}>
              <View style={styles.bottomSheetOptionIconLabel}>
                <Icon icon="about" />
                <Text>
                  <FormattedMessage
                    defaultMessage="About"
                    description="About message item in Home bottom sheet panel"
                  />
                </Text>
              </View>
              <Icon icon="arrow_right" />
            </View>
          </PressableNative>
        </Link>
        <PressableNative
          onPress={onLogout}
          style={styles.bottomSheetOptionButton}
        >
          <View style={styles.bottomSheetOptionContainer}>
            <View style={styles.bottomSheetOptionIconLabel}>
              <Icon icon="logout" />
              <Text>
                <FormattedMessage
                  defaultMessage="Logout"
                  description="logout link"
                />
              </Text>
            </View>
            <Icon icon="arrow_right" />
          </View>
        </PressableNative>
      </View>
    </BottomSheetModal>
  );
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
