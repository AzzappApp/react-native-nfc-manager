/**
 * A wrapper around TextInput that adds Azzapp's default styling and label
 * https://www.figma.com/file/fmJgyUlpDU8G77GqH9H4rE/STYLE-GUIDE?node-id=1080-3228&t=amo3m9DlPFlHHOqi-0
 */
import { forwardRef } from 'react';
import Label from './Label';
import TextInput from './TextInput';
import type { TextInputProps } from './TextInput';
import type { ForwardedRef } from 'react';
import type {
  TextInput as NativeTextInput,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';

export type TextInputLabelProps = Omit<TextInputProps, 'style'> & {
  label: string;
  labelID: string;
  labelStyle?: StyleProp<ViewStyle> | undefined;
  inputStyle?: StyleProp<TextStyle> | undefined;
};

const TextInputLabel = (
  { label, labelID, labelStyle, inputStyle, ...props }: TextInputLabelProps,
  ref: ForwardedRef<NativeTextInput>,
) => {
  return (
    <Label style={labelStyle} label={label} labelID={labelID}>
      <TextInput style={inputStyle} {...props} ref={ref} />
    </Label>
  );
};

export default forwardRef(TextInputLabel);
