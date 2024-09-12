import { useCallback, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView, //we want to use this one here on purpose
} from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
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

  onFocus?: () => void;

  loading?: boolean;
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
  onFocus,
  loading,
  ...props
}: TextAreaModalProps) => {
  const intl = useIntl();
  const styles = useStyleSheet(styleSheet);
  const [text, setText] = useState(value);

  const onCancel = useCallback(() => {
    setText(value);
    onClose();
  }, [onClose, value]);

  const onBlur = useCallback(() => {
    if (closeOnBlur) {
      onClose();
    }
  }, [closeOnBlur, onClose]);

  const onShow = useCallback(() => {
    // hack - on android autofocus doesn't open the keyboard
    if (Platform.OS === 'android') {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 150);
    }
  }, []);

  const textInputRef = useRef<TextInputBase>(null);

  return (
    <Modal
      onRequestClose={onClose}
      transparent
      animationType="fade"
      {...props}
      onShow={onShow}
    >
      <SafeAreaView style={styles.modal}>
        <Header
          style={styles.header}
          leftElement={
            <HeaderButton
              label={intl.formatMessage({
                defaultMessage: 'Cancel',
                description: 'Cancel button label in text edition modal',
              })}
              variant="secondary"
              onPress={onCancel}
              disabled={loading}
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
              loading={loading}
              onPress={() => {
                onChangeText(text);
              }}
            />
          }
        />
        <KeyboardAvoidingView behavior="padding" style={styles.contentModal}>
          {ItemTopComponent}
          <TextInput
            multiline
            placeholder={placeholder}
            value={text}
            onChangeText={setText}
            autoFocus={Platform.OS === 'ios'}
            onFocus={onFocus}
            maxLength={maxLength}
            onBlur={onBlur}
            style={styles.textInput}
            ref={textInputRef}
            readOnly={loading}
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
      </SafeAreaView>
    </Modal>
  );
};

export default TextAreaModal;

const styleSheet = createStyleSheet(appearance => ({
  modal: {
    flex: 1,
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
  },
  header: {
    marginBottom: 10,
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
    marginBottom: 30,
  },
  textInput: {
    borderWidth: 0,
    flex: 1,
    lineHeight: 24,
    verticalAlign: 'top',
  },
}));
