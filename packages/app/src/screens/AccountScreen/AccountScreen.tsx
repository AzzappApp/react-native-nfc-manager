import { useReducer } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { useLogout } from '#hooks/useLogout';
import useViewportSize, { insetBottom } from '#hooks/useViewportSize';
import BottomSheetModal from '#ui/BottomSheetModal';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import AccountScreenMiddleHeader from './AccountScreenMiddleHeader';
import AccountScreenProfiles from './AccountScreenProfiles';
import type { AccountScreen_user$key } from '@azzapp/relay/artifacts/AccountScreen_user.graphql';

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

type AccountScreenProps = {
  user: AccountScreen_user$key;
};

const AccountScreen = ({ user: userKey }: AccountScreenProps) => {
  const [{ showDropdown, requestedLogout }, dispatch] = useReducer(reducer, {
    showDropdown: false,
    requestedLogout: false,
  });

  const { email, phoneNumber, ...userProfiles } = useFragment(
    graphql`
      fragment AccountScreen_user on User {
        email
        phoneNumber
        ...AccountScreenProfiles_userProfiles
      }
    `,
    userKey,
  );

  const vp = useViewportSize();

  const appearanceStyle = useStyleSheet(computedStyles);

  const intl = useIntl();

  const logout = useLogout();

  return (
    <View>
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
        height={vp`${insetBottom}  + ${440}`}
        contentContainerStyle={appearanceStyle.bottomSheetContainer}
        onDismiss={() => {
          if (requestedLogout) {
            logout();
          }
        }}
        onRequestClose={() => {
          dispatch({ type: 'CLOSE_DROPDOWN' });
        }}
      >
        <View style={appearanceStyle.bottomSheetOptionsContainer}>
          <PressableNative
            onPress={() => {
              dispatch({ type: 'LOGOUT' });
            }}
            style={appearanceStyle.bottomSheetOptionButton}
          >
            <View style={appearanceStyle.bottomSheetOptionContainer}>
              <View style={appearanceStyle.bottomSheetOptionIconLabel}>
                <Icon icon="logout" style={appearanceStyle.icon} />
                <Text>
                  <FormattedMessage
                    defaultMessage="Logout"
                    description="logout link"
                  />
                </Text>
              </View>
              <Icon icon="arrow_right" style={appearanceStyle.icon} />
            </View>
          </PressableNative>
        </View>
      </BottomSheetModal>
    </View>
  );
};

const computedStyles = createStyleSheet(appearance => ({
  icon: {
    tintColor: appearance === 'light' ? colors.black : colors.white,
  },
  bottomSheetContainer: {
    marginTop: 10,
    paddingHorizontal: 0,
  },
  bottomSheetOptionsContainer: { paddingHorizontal: 20, paddingTop: 20 },
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

export default AccountScreen;
