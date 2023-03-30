import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { colors } from '#theme';
import Button from '#ui/Button';
import type { ButtonProps } from '#ui/Button';

const ContinueButton = (
  props: Omit<ButtonProps, 'label'> & { label?: string | null },
) => {
  const intl = useIntl();
  return (
    <Button
      {...props}
      label={
        props.label ??
        intl.formatMessage({
          defaultMessage: 'Continue',
          description: 'NewProfileScreen - Continue Button',
        })
      }
      style={[styles.button, props.style]}
    />
  );
};

export default ContinueButton;

const styles = StyleSheet.create({
  button: {
    height: 45,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
  },
});
