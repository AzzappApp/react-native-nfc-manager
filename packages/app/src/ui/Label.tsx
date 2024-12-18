import { StyleSheet, View } from 'react-native';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import Text from '#ui/Text';
import type { ReactNode } from 'react';
import type { StyleProp, ViewProps, TextStyle } from 'react-native';

export type LabelProps = ViewProps & {
  /**
   * The label text to display.
   */
  label: ReactNode;
  /**
   * The native id of the label (used for accessibility)
   */
  labelID: string;
  /**
   * The error message to display.
   */
  error?: string | null;
  /**
   * The style of the error message.
   */
  errorStyle?: StyleProp<TextStyle>;

  /**
   * Whether to show the error message or not.(and reserve the error view height)
   * Default: true
   * have the bottom height reserved can cause issue in horizontal alignment but can cause blink if height is not reserved
   * Best way is to let the developer allows it or not(minHeight to zero is not working)
   */
  showError?: boolean;
};

/**
 * Wrap a form element with a label and an error message.
 */
const Label = ({
  label,
  error,
  errorStyle,
  labelID,
  children,
  showError = true,
  ...props
}: LabelProps) => {
  return (
    <View {...props}>
      <Text nativeID={labelID} style={styles.label} variant="button">
        {label}
      </Text>
      {children}
      {showError && (
        <Text
          variant="error"
          style={errorStyle}
          numberOfLines={2}
          allowFontScaling
        >
          {isNotFalsyString(error) ? error : ' '}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    paddingBottom: 5,
  },
});

export default Label;
