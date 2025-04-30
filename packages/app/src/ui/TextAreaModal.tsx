import { useCallback, useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { KeyboardAvoidingView } from 'react-native';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { colors } from '#theme';
import AnimatedText from '#components/AnimatedText';
import { ScreenModal } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import SafeAreaView from '#ui/SafeAreaView';
import Header from './Header';
import HeaderButton from './HeaderButton';
import TextInput from './TextInput';
import type { ReactNode } from 'react';

export type TextAreaModalProps = {
  /**
   * If true, display the modal. Defaults to false.
   */
  visible?: boolean;
  /**
   * The content of the modal.
   */
  children?: ReactNode | null;
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
  onFocus,
  loading,
  visible,
  ...props
}: TextAreaModalProps) => {
  const intl = useIntl();
  const styles = useStyleSheet(styleSheet);
  const textSharedValueLength = useSharedValue<number>(value.length);

  const internalText = useRef('');

  const onCancel = useCallback(() => {
    internalText.current = value;
    onClose();
  }, [onClose, value]);

  const onChangeTextInternal = (newText: string) => {
    textSharedValueLength.set(newText.length);
    internalText.current = newText;
  };

  const animatedText = useDerivedValue(() => {
    return `${textSharedValueLength.value} / ${maxLength}`;
  }, [maxLength]);

  const animatedTextColor = useDerivedValue(() => {
    return maxLength && textSharedValueLength.value >= maxLength
      ? colors.red400
      : undefined;
  }, [maxLength]);

  useEffect(() => {
    if (visible) {
      textSharedValueLength.set(value.length);
      internalText.current = value;
    } else {
      textSharedValueLength.set(0);
      internalText.current = '';
    }
  }, [textSharedValueLength, value, visible]);

  return (
    <ScreenModal
      onRequestDismiss={onCancel}
      animationType="fade"
      visible={visible}
      {...props}
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
                onChangeText(internalText.current);
              }}
            />
          }
        />
        <KeyboardAvoidingView behavior="padding" style={styles.contentModal}>
          {ItemTopComponent}
          <TextInput
            multiline
            placeholder={placeholder}
            defaultValue={value}
            onChangeText={onChangeTextInternal}
            autoFocus
            onFocus={onFocus}
            maxLength={maxLength}
            style={styles.textInput}
            readOnly={loading}
          />
          {maxLength != null && (
            <AnimatedText
              variant="smallbold"
              style={styles.counter}
              animatedTextColor={animatedTextColor}
              text={animatedText}
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenModal>
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
