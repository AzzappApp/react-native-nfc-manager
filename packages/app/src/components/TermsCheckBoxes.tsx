import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import CheckBox from '#ui/CheckBox';
import HyperLink from '#ui/HyperLink';
import Text from '#ui/Text';
import type { CheckboxStatus } from '#ui/CheckBox';

type TermsCheckBoxesProps = {
  communicationChecked: CheckboxStatus;
  onCommunicationCheckChange: (status: CheckboxStatus) => void;
  termsOfUseChecked: CheckboxStatus;
  onTermsOfUseCheckChange: (status: CheckboxStatus) => void;
  showError: boolean;
};

const TERMS_OF_SERVICE = process.env.TERMS_OF_SERVICE;
const PRIVACY_POLICY = process.env.PRIVACY_POLICY;

const TermsCheckBoxes = ({
  communicationChecked,
  onCommunicationCheckChange,
  termsOfUseChecked,
  onTermsOfUseCheckChange,
  showError,
}: TermsCheckBoxesProps) => {
  const intl = useIntl();
  return (
    <>
      <View style={styles.checkboxesContainer}>
        <CheckBox
          label={
            <Text style={styles.checkLabel} variant="medium">
              <FormattedMessage
                defaultMessage="I want to receive communications about promotions and news from azzapp."
                description="Signup Screen - accept communications label"
              />{' '}
            </Text>
          }
          status={communicationChecked}
          onValueChange={onCommunicationCheckChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage:
              'Tap to accept to receive communications about promotions and news from azzapp.',
            description:
              'Signup Screen - Accessibility checkbox communications',
          })}
        />
        <CheckBox
          label={
            <Text style={styles.checkLabel} variant="medium">
              <FormattedMessage
                defaultMessage="I have read and accept the <tosLink>Terms of Use</tosLink> and <ppLink>Privacy Policy</ppLink> of azzapp"
                description="Signup Screen - 'I have read and accept the' Terms of use"
                values={{
                  tosLink: value => (
                    <HyperLink
                      label={value[0] as string}
                      url={`${TERMS_OF_SERVICE}`}
                    />
                  ),
                  ppLink: value => (
                    <HyperLink
                      label={value[0] as string}
                      url={`${PRIVACY_POLICY}`}
                    />
                  ),
                }}
              />
            </Text>
          }
          status={termsOfUseChecked}
          onValueChange={onTermsOfUseCheckChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Tap to accept the privacy policy',
            description:
              'Signup Screen - Accessibility checkbox  Privacy Policy',
          })}
        />
      </View>
      {showError && (
        <Text style={styles.error} variant="error">
          <FormattedMessage
            defaultMessage="You need to accept the Terms of Use and the Privacy Policy"
            description="Signup Screen - error message when the user did not accept the terms of use and the privacy policy"
          />
        </Text>
      )}
    </>
  );
};

export default TermsCheckBoxes;

const styles = StyleSheet.create({
  checkboxesContainer: {
    marginBottom: 20,
  },
  checkLabel: {
    paddingLeft: 11,
  },
  error: {
    paddingLeft: 10,
    marginTop: 10,
  },
});
