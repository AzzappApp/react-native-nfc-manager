import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
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
    marginHorizontal: 20,
    marginBottom: 34,
  },
});
