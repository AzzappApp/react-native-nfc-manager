import { useReducer } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { graphql, usePreloadedQuery } from 'react-relay';
import { colors } from '#theme';
import Link from '#components/Link';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { logout } from '#helpers/MobileWebAPI';
import relayScreen from '#helpers/relayScreen';
import BottomSheetModal from '#ui/BottomSheetModal';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import AccountScreenMiddleHeader from './AccountScreenMiddleHeader';
import AccountScreenProfiles from './AccountScreenProfiles';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { AccountRoute } from '#routes';
import type { AccountScreenQuery } from '@azzapp/relay/artifacts/AccountScreenQuery.graphql';

const reducer = (
  state: { showDropdown: boolean; requestedLogout: boolean },
  action: { type: 'CLOSE_DROPDOWN' | 'LOGOUT' | 'OPEN_DROPDOWN' },
) => {
  switch (action.type) {
    case 'LOGOUT':
      return {
        ...state,
        showDropdown: false,
        requestedLogout: true,
      };
    case 'CLOSE_DROPDOWN':
      return {
        ...state,
        showDropdown: false,
      };
    case 'OPEN_DROPDOWN':
      return {
        ...state,
        showDropdown: true,
      };

    default:
      return state;
  }
};

const accountScreenQuery = graphql`
  query AccountScreenQuery {
    currentUser {
      email
      phoneNumber
      ...AccountScreenProfiles_userProfiles
    }
  }
`;

const AccountScreen = ({
  preloadedQuery,
}: RelayScreenProps<AccountRoute, AccountScreenQuery>) => {
  const [{ showDropdown, requestedLogout }, dispatch] = useReducer(reducer, {
    showDropdown: false,
    requestedLogout: false,
  });

  const {
    currentUser: { email, phoneNumber, ...userProfiles },
  } = usePreloadedQuery(accountScreenQuery, preloadedQuery);

  const intl = useIntl();
  const styles = useStyleSheet(styleSheet);
  const insets = useSafeAreaInsets();

  const close = () => {
    dispatch({ type: 'CLOSE_DROPDOWN' });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header
        middleElement={
          <AccountScreenMiddleHeader
            emailOrPhoneNumber={email ?? phoneNumber ?? ''}
          />
        }
        rightElement={
          <IconButton
            style={{ borderWidth: 0 }}
            size={35}
            onPress={() => dispatch({ type: 'OPEN_DROPDOWN' })}
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Open user settings',
              description:
                'Open bottom menu to change user settings, like logout, change password, etc.',
            })}
            icon="menu"
          />
        }
      />
      <AccountScreenProfiles userProfiles={userProfiles} />
      <BottomSheetModal
        visible={showDropdown}
        height={insets.bottom + 440}
        contentContainerStyle={styles.bottomSheetContainer}
        onDismiss={() => {
          if (requestedLogout) {
            void logout();
          }
        }}
        onRequestClose={close}
      >
        <View style={styles.bottomSheetOptionsContainer}>
          <Link route="ACCOUNT_DETAILS">
            <PressableNative
              style={styles.bottomSheetOptionButton}
              onPress={close}
            >
              <View style={styles.bottomSheetOptionContainer}>
                <View style={styles.bottomSheetOptionIconLabel}>
                  <Icon icon="warning" style={styles.icon} />
                  <Text>
                    <FormattedMessage
                      defaultMessage="Account details"
                      description="Link to open account details form to change email, phone number, etc."
                    />
                  </Text>
                </View>
                <Icon icon="arrow_right" style={styles.icon} />
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
                  <Icon icon="invite" style={styles.icon} />
                  <Text>
                    <FormattedMessage
                      defaultMessage="Invite friends"
                      description="Invite friends to join the app"
                    />
                  </Text>
                </View>
                <Icon icon="arrow_right" style={styles.icon} />
              </View>
            </PressableNative>
          </Link>
          <PressableNative
            onPress={() => {
              dispatch({ type: 'LOGOUT' });
            }}
            style={styles.bottomSheetOptionButton}
          >
            <View style={styles.bottomSheetOptionContainer}>
              <View style={styles.bottomSheetOptionIconLabel}>
                <Icon icon="logout" style={styles.icon} />
                <Text>
                  <FormattedMessage
                    defaultMessage="Logout"
                    description="logout link"
                  />
                </Text>
              </View>
              <Icon icon="arrow_right" style={styles.icon} />
            </View>
          </PressableNative>
        </View>
      </BottomSheetModal>
    </SafeAreaView>
  );
};

export default relayScreen(AccountScreen, {
  query: accountScreenQuery,
});

const styleSheet = createStyleSheet(appearance => ({
  icon: {
    tintColor: appearance === 'light' ? colors.black : colors.white,
  },
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
}));
