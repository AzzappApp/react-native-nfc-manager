import { useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { colors } from '#theme';
import useScreenInsets from '#hooks/useScreenInsets';
import Header from './Header';
import HeaderButton from './HeaderButton';
import Text from './Text';
import TextInput from './TextInput';
import type { ModalProps, TextInput as TextInputBase } from 'react-native';

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
   * The title of the header modal
   */
  headerTitle?: string;
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
  headerTitle,
  onChangeText,
  onClose,
  ItemTopComponent,
  closeOnBlur = true,
  ...props
}: TextAreaModalProps) => {
  const intl = useIntl();
  const { top: insetTop } = useScreenInsets();

  const [text, setText] = useState(value);

  const onCancel = () => {
    setText(value);
    onClose();
  };

  const onBlur = () => {
    if (closeOnBlur) {
      onClose();
    }
  };

  const textInputRef = useRef<TextInputBase>(null);

  return (
    <Modal
      onRequestClose={onClose}
      transparent
      animationType="fade"
      {...props}
      onShow={() => {
        // hack - on android autofocus doesn't open the keyboard
        if (Platform.OS === 'android') {
          textInputRef.current?.focus();
        }
      }}
    >
      <View style={styles.modal}>
        <Header
          style={{
            marginTop: insetTop,
            marginBottom: 10,
          }}
          leftElement={
            <HeaderButton
              label={intl.formatMessage({
                defaultMessage: 'Cancel',
                description: 'Cancel button label in text edition modal',
              })}
              variant="secondary"
              onPress={onCancel}
            />
          }
          middleElement={
            headerTitle ??
            intl.formatMessage({
              defaultMessage: 'Description',
              description: 'Post creation screen textarea modal title',
            })
          }
          rightElement={
            <HeaderButton
              label={intl.formatMessage({
                defaultMessage: 'Ok',
                description: 'Ok button label in text edition modal',
              })}
              onPress={() => {
                onChangeText(text);
                onClose();
              }}
            />
          }
        />
        <KeyboardAvoidingView behavior="height" style={styles.contentModal}>
          {ItemTopComponent}
          <TextInput
            multiline
            placeholder={placeholder}
            value={text}
            onChangeText={setText}
            autoFocus={Platform.OS === 'ios'}
            maxLength={maxLength}
            onBlur={onBlur}
            style={styles.textInput}
            ref={textInputRef}
          />
          {maxLength != null && (
            <Text
              variant="smallbold"
              style={[
                styles.counter,
                text.length >= maxLength && {
                  color: colors.red400,
                },
              ]}
            >
              {text?.length ?? 0} / {maxLength}
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
  textInput: {
    borderWidth: 0,
    flex: 1,
    lineHeight: 24,
    verticalAlign: 'top',
  },
});
