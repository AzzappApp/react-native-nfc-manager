import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useMutation } from 'react-relay';
import ERRORS from '@azzapp/shared/errors';
import TermsCheckBoxes from '#components/TermsCheckBoxes';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import Button from '#ui/Button';
import Container from '#ui/Container';
import SafeAreaView from '#ui/SafeAreaView';
import Text from '#ui/Text';
import type { AcceptTermsScreenMutation } from '#relayArtifacts/AcceptTermsScreenMutation.graphql';
import type { CheckboxStatus } from '#ui/CheckBox';

const AcceptTermsScreen = () => {
  const [communicationChecked, setCommunicationChecked] =
    useState<CheckboxStatus>('checked');
  const [termsOfUseChecked, setTermsOfUseChecked] =
    useState<CheckboxStatus>('none');
  const [showTOSError, setShowTOSError] = useState(false);
  const [commit, inFlight] = useMutation<AcceptTermsScreenMutation>(graphql`
    mutation AcceptTermsScreenMutation {
      acceptTermsOfUse {
        user {
          hasAcceptedLastTermsOfUse
        }
      }
    }
  `);

  const onSubmit = () => {
    if (termsOfUseChecked === 'none') {
      setShowTOSError(true);
      return;
    }
    commit({
      variables: {},
      onError: error => {
        console.error(error);
        if (error.message === ERRORS.UNAUTHORIZED) {
          void dispatchGlobalEvent({ type: 'SIGN_OUT' });
        } else {
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'An error occurred',
              description:
                'Error message displayed when accept cgu fail in Accept CGU modal',
            }),
          });
        }
      },
    });
  };

  const intl = useIntl();
  return (
    <Container style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.contentContainer}>
          <Text variant="xlarge">
            <FormattedMessage
              defaultMessage="Accept azzapp’s Terms & review privacy notice"
              description="Accept Terms screen title"
            />
          </Text>
          <TermsCheckBoxes
            communicationChecked={communicationChecked}
            termsOfUseChecked={termsOfUseChecked}
            onCommunicationCheckChange={setCommunicationChecked}
            onTermsOfUseCheckChange={setTermsOfUseChecked}
            showError={showTOSError}
          />
        </View>

        <Button
          variant="primary"
          testID="submit"
          label={intl.formatMessage({
            defaultMessage: 'Continue',
            description: 'Accept Terms Screen - Continue button',
          })}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Tap to continue',
            description: 'Accept Terms Screen - Accessibility Continue button',
          })}
          style={styles.button}
          loading={inFlight}
          onPress={onSubmit}
        />
      </SafeAreaView>
    </Container>
  );
};

export default AcceptTermsScreen;

const styles = StyleSheet.create({
  contentContainer: {
    gap: 20,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
});
