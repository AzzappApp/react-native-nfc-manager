import RPNInput from 'react-phone-number-input/react-native-input';
import TextInput from '#ui/TextInput';
import type { TextInputProps } from '#ui/TextInput';
import type { Props as RPNIProps } from 'react-phone-number-input/input';

type PhoneInputProps = Omit<
  RPNIProps<Omit<TextInputProps, 'onChange' | 'onTextChange' | 'value'>>,
  'Component' | 'inputComponent' | 'smartCaret'
>;

/**
 * PhoneInput is a wrapper around react-phone-number-input that uses our TextInput
 * @see RPNInput
 */
const PhoneInput = (props: PhoneInputProps) => (
  <RPNInput inputComponent={TextInput as any} {...props} />
);

export default PhoneInput;
