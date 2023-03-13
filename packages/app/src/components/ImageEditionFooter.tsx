import { FormattedMessage } from 'react-intl';
import { StyleSheet, Text, View } from 'react-native';
import { textStyles } from '#theme';
import PressableNative from '#ui/PressableNative';
import type { ViewProps } from 'react-native';

type EditionFooterProps = ViewProps & {
  /**
   * Callback called when the user clicks on the save button.
   */
  onSave(): void;
  /**
   * Callback called when the user clicks on the cancel button.
   */
  onCancel(): void;
};

/**
 * A footer containing two buttons to cancel or save, used in the Image edition screens.
 */
const ImageEditionFooter = ({
  onCancel,
  onSave,
  style,
  ...props
}: EditionFooterProps) => (
  <View style={[styles.footer, style]} {...props}>
    <PressableNative onPress={onCancel}>
      <Text style={textStyles.button}>
        <FormattedMessage
          defaultMessage="Cancel"
          description="Cancel button in Image edition screen"
        />
      </Text>
    </PressableNative>
    <PressableNative onPress={onSave}>
      <Text style={textStyles.button}>
        <FormattedMessage
          defaultMessage="Validate"
          description="Validate button in Image edition screen"
        />
      </Text>
    </PressableNative>
  </View>
);

export default ImageEditionFooter;

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: '10%',
  },
});
