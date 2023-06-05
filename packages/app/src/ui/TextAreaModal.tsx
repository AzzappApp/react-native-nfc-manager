import { useIntl } from 'react-intl';
import { KeyboardAvoidingView, Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '#theme';
import Header from './Header';
import HeaderButton from './HeaderButton';
import Text from './Text';
import TextInput from './TextInput';
import type { ModalProps } from 'react-native';

export type TextAreaModalProps = Omit<
  ModalProps,
  'onRequestClose' | 'transparent'
> & {
  /**
   * The current value of the textarea
   */
  value: string;
  /**
   * The placeholder to show when the textarea is empty
   */
  placeholder?: string;
  /**
   * The maximum length of the textarea
   */
  maxLength?: number;
  /**
   * A callback that is called when the user change the text
   */
  onChangeText: (text: string) => void;
  /**
   * A callback that is called when the user close the modal
   */
  onClose: () => void;
  /**
   * A Item component to render on top of the modal, under the header
   */
  ItemTopComponent?: React.ReactElement;
  /**
   * If true, the modal will close when the textInput onBlur is called
   */
  closeOnBlur?: boolean;
};

/**
 * A modal containing a textarea to edit text
 */
const TextAreaModal = ({
  placeholder,
  value,
  maxLength,
  onChangeText,
  onClose,
  ItemTopComponent,
  closeOnBlur = true,
  ...props
}: TextAreaModalProps) => {
  const intl = useIntl();
  const { top: insetTop } = useSafeAreaInsets();

  const onBlur = () => {
    if (closeOnBlur) {
      onClose();
    }
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose} {...props}>
      <View style={styles.modal}>
        <Header
          style={{
            marginTop: insetTop,
            marginBottom: 10,
          }}
          middleElement={intl.formatMessage({
            defaultMessage: 'Description',
            description: 'Post creation screen textarea modal title',
          })}
          rightElement={
            <HeaderButton
              label={intl.formatMessage({
                defaultMessage: 'Ok',
                description: 'Ok button label in text edition modal',
              })}
              onPress={onClose}
            />
          }
        />
        <KeyboardAvoidingView behavior="height" style={styles.contentModal}>
          {ItemTopComponent}
          <TextInput
            multiline
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            autoFocus
            maxLength={maxLength}
            onBlur={onBlur}
            style={{ borderWidth: 0, flex: 1 }}
          />
          {maxLength != null && (
            <Text
              variant="smallbold"
              style={[
                styles.counter,
                value.length >= maxLength && {
                  color: colors.red400,
                },
              ]}
            >
              {value?.length ?? 0} / {maxLength}
            </Text>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default TextAreaModal;

const styles = StyleSheet.create({
  modal: {
    flex: 1,
  },
  contentModal: {
    flex: 1,
    backgroundColor: `${colors.black}AA`,
    height: 1,
    padding: 10,
  },
  counter: {
    marginTop: 5,
    marginLeft: 12,
    color: 'white',
  },
});
