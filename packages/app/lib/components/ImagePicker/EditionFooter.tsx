import { FormattedMessage } from 'react-intl';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { textStyles } from '../../../theme';
import type { ViewProps } from 'react-native';

type EditionFooterProps = ViewProps & {
  onSave(): void;
  onCancel(): void;
};
const EditionFooter = ({
  onCancel,
  onSave,
  style,
  ...props
}: EditionFooterProps) => (
  <View style={[styles.footer, style]} {...props}>
    <Pressable
      onPress={onCancel}
      style={({ pressed }) => pressed && { opacity: 0.8 }}
    >
      <Text style={textStyles.button}>
        <FormattedMessage
          defaultMessage="Cancel"
          description="Cancel button in Image edition screen"
        />
      </Text>
    </Pressable>
    <Pressable
      onPress={onSave}
      style={({ pressed }) => pressed && { opacity: 0.8 }}
    >
      <Text style={textStyles.button}>
        <FormattedMessage
          defaultMessage="Validate"
          description="Validate button in Image edition screen"
        />
      </Text>
    </Pressable>
  </View>
);

export default EditionFooter;

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: '10%',
  },
});
