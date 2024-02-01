import { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import InputAccessoryView from '#ui/InputAccessoryView';
import TextInput from '#ui/TextInput';
import type { TextInput as NativeTextInput } from 'react-native';

type CoverEditorTitleModalProps = {
  visible: boolean;
  title: string | null | undefined;
  subTitle: string | null | undefined;
  onTitleChange: (title: string) => void;
  onSubtitleChange: (title: string) => void;
  onClose: () => void;
};

const CoverEditorTitleModal = ({
  visible,
  title,
  subTitle,
  onTitleChange,
  onSubtitleChange,
  onClose,
}: CoverEditorTitleModalProps) => {
  const subTitleInputRef = useRef<NativeTextInput>(null);
  const focusSubTitle = useCallback(() => {
    subTitleInputRef.current?.focus();
  }, []);

  return (
    <InputAccessoryView visible={visible} onClose={onClose}>
      <View style={styles.titleModalContent}>
        <TextInput
          autoFocus
          value={title ?? ''}
          onChangeText={onTitleChange}
          returnKeyType="next"
          onSubmitEditing={focusSubTitle}
        />
        <TextInput
          ref={subTitleInputRef}
          value={subTitle ?? ''}
          onChangeText={onSubtitleChange}
          returnKeyType="done"
          onSubmitEditing={onClose}
        />
      </View>
    </InputAccessoryView>
  );
};

export default CoverEditorTitleModal;

const styles = StyleSheet.create({
  titleModalContent: {
    height: 144,
    justifyContent: 'space-around',
    padding: 20,
  },
});
