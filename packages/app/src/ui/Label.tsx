import { StyleSheet, Text, View } from 'react-native';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import { fontFamilies, textStyles } from '#theme';
import type { StyleProp, ViewProps, TextStyle } from 'react-native';

export type LabelProps = ViewProps & {
  /**
   * The label text to display.
   */
  label: string;
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
  ...props
}: LabelProps) => {
  return (
    <View {...props}>
      <Text nativeID={labelID} style={styles.label}>
        {label}
      </Text>
      {children}

      <Text
        style={[styles.error, errorStyle]}
        numberOfLines={2}
        allowFontScaling
      >
        {isNotFalsyString(error) ? error : ' '}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    ...fontFamilies.semiBold,
    paddingBottom: 5,
    size: 14,
  },
  error: {
    ...textStyles.error,
    minHeight: 15,
  },
});

export default Label;
