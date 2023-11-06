import { memo, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { Platform, StyleSheet, View } from 'react-native';
import Link from '#components/Link';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import useScreenInsets from '#hooks/useScreenInsets';
import useToggle from '#hooks/useToggle';
import BottomSheetModal from '#ui/BottomSheetModal';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';

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
};

const HomeBottomSheetPanel = ({ visible, close }: HomeBottomSheetPanel) => {
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

  return (
    <BottomSheetModal
      visible={visible}
      height={bottom + 300}
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
        </>
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
