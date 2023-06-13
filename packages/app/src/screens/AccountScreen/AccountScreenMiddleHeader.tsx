import { useReducer } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import { logout } from '#helpers/MobileWebAPI';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';

const headerReducer = (
  state: { showDropdown: boolean; goToSignIn: boolean; goToSignUp: boolean },
  action: {
    type:
      | 'CLOSE_DROPDOWN'
      | 'CONNECT_TO_EXISTING_ACCOUNT'
      | 'CREATE_NEW_ACCOUNT'
      | 'OPEN_DROPDOWN';
  },
) => {
  switch (action.type) {
    case 'CONNECT_TO_EXISTING_ACCOUNT':
      return {
        ...state,
        showDropdown: false,
        goToSignIn: true,
      };
    case 'CREATE_NEW_ACCOUNT':
      return {
        ...state,
        showDropdown: false,
        goToSignUp: true,
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

const AccountScreenMiddleHeader = ({
  emailOrPhoneNumber,
}: {
  emailOrPhoneNumber: string;
}) => {
  const [{ showDropdown, goToSignIn, goToSignUp }, dispatch] = useReducer(
    headerReducer,
    {
      showDropdown: false,
      goToSignIn: false,
      goToSignUp: false,
    },
  );

  const intl = useIntl();

  const router = useRouter();

  return (
    <View>
      <PressableNative
        style={{ alignItems: 'center' }}
        onPress={() => dispatch({ type: 'OPEN_DROPDOWN' })}
      >
        <Text variant="large">
          <FormattedMessage
            defaultMessage="My Webcards"
            description="Account screen header title where current profile can be changed"
          />
        </Text>
        <View style={styles.headerEmailOrPhoneNumber}>
          <Text variant="medium" style={styles.headerEmailOrPhoneNumberLabel}>
            {emailOrPhoneNumber}
          </Text>

          <Icon icon="arrow_down_fill" style={styles.headerArrowIcon} />
        </View>
      </PressableNative>

      <BottomSheetModal
        visible={showDropdown}
        variant="modal"
        showGestureIndicator={false}
        onRequestClose={() => dispatch({ type: 'CLOSE_DROPDOWN' })}
        headerTitle={intl.formatMessage({
          defaultMessage: 'Change account',
          description: 'Change account modal title',
        })}
        onDismiss={() => {
          if (goToSignIn) {
            void logout();
          } else if (goToSignUp) {
            router.replace({ route: 'SIGN_UP' });
            void logout();
          }
        }}
      >
        <View style={{ rowGap: 10 }}>
          <Button
            variant="primary"
            onPress={() => dispatch({ type: 'CONNECT_TO_EXISTING_ACCOUNT' })}
            label={intl.formatMessage({
              defaultMessage: 'Connect to existing account',
              description: 'Connect to existing account button label',
            })}
          />

          <PressableNative
            style={styles.headerCreateAccountButton}
            onPress={() =>
              dispatch({
                type: 'CREATE_NEW_ACCOUNT',
              })
            }
            role="button"
          >
            <Text variant="medium">
              <FormattedMessage
                defaultMessage="Create a new account"
                description="Create a new account button label"
              />
            </Text>
          </PressableNative>
        </View>
      </BottomSheetModal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerEmailOrPhoneNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 2,
  },
  headerEmailOrPhoneNumberLabel: {
    color: colors.grey200,
  },
  headerArrowIcon: {
    tintColor: colors.grey200,
    width: 14,
    height: 14,
  },
  headerCreateAccountButton: {
    alignItems: 'center',
    height: 47,
    justifyContent: 'center',
  },
});

export default AccountScreenMiddleHeader;
