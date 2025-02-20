import { memo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Linking, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { colors } from '#theme';
import BottomSheetPopup from '#components/popup/BottomSheetPopup';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useAcceptTermsOfUseMutation from '#hooks/useAcceptTermsOfUseMutation';
import useSignOut from '#hooks/useSignOut';
import Button from '#ui/Button';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';

const TERMS_OF_SERVICE = process.env.TERMS_OF_SERVICE;
const PRIVACY_POLICY = process.env.PRIVACY_POLICY;

export type AcceptTermsOfUseModalProps = { visible: boolean };

const AcceptTermsOfUseModal = ({ visible }: AcceptTermsOfUseModalProps) => {
  const intl = useIntl();
  const onSignOut = useSignOut();
  const styles = useStyleSheet(stylesheet);
  const [commit] = useAcceptTermsOfUseMutation();

  const openTOS = () => Linking.openURL(TERMS_OF_SERVICE);
  const openPP = () => Linking.openURL(PRIVACY_POLICY);

  const accept = () => {
    commit({
      variables: {},
      onError: error => {
        console.error(error);
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'An error occured',
            description:
              'Error message displayed when accept cgu fail in Accept CGU modal',
          }),
        });
      },
    });
  };

  return (
    <BottomSheetPopup visible={visible} onDismiss={() => {}} isAnimatedContent>
      <View style={styles.popupContainer}>
        <View style={styles.popupPage}>
          <Text variant="large" style={styles.popupHeaderTextContainer}>
            <FormattedMessage
              defaultMessage="We’ve updated our Terms"
              description="Title in Accept cgu modal"
            />
          </Text>
          <Text variant="medium" style={styles.popupDescriptionTextContainer}>
            <FormattedMessage
              defaultMessage="To continue using azzapp, you need to confirm that you agree to our Terms of Service and have read our Privacy Policy"
              description="Description in Accept cgu modal"
            />
          </Text>
        </View>
        <View style={styles.buttonsContainer}>
          <Button
            appearance="light"
            variant="secondary"
            onPress={openTOS}
            label={intl.formatMessage({
              defaultMessage: 'Terms of service',
              description: 'Terms of service button in Accept cgu modal',
            })}
          />
          <Button
            appearance="light"
            variant="secondary"
            onPress={openPP}
            label={intl.formatMessage({
              defaultMessage: 'Privacy Policy',
              description: 'Privacy Policy button in Accept cgu modal',
            })}
          />
          <Button
            appearance="light"
            onPress={accept}
            label={intl.formatMessage({
              defaultMessage: 'Accept',
              description: 'Accept button in Accept cgu modal',
            })}
          />
          <PressableOpacity onPress={onSignOut} testID="logout">
            <Text variant="small" style={styles.centerGreyText}>
              <FormattedMessage
                defaultMessage="Logout"
                description="Logout button in Accept cgu modal"
              />
            </Text>
          </PressableOpacity>
        </View>
      </View>
    </BottomSheetPopup>
  );
};

export default memo(AcceptTermsOfUseModal);

const stylesheet = createStyleSheet(() => ({
  popupContainer: {
    backgroundColor: colors.white,
    width: 295,
    borderRadius: 20,
    alignSelf: 'center',
    padding: 20,
    alignContent: 'center',
  },
  popupPage: { top: 0, width: '100%', paddingBottom: 20 },
  popupHeaderTextContainer: {
    color: colors.black,
    paddingTop: 20,
    textAlign: 'center',
  },
  popupDescriptionTextContainer: {
    color: colors.black,
    paddingTop: 10,
    textAlign: 'center',
  },
  centerGreyText: {
    color: colors.grey200,
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 40,
  },
  buttonsContainer: {
    gap: 10,
  },
}));
