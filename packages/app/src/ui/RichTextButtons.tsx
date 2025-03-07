import { memo } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import BottomSheetTextEditorButton from './BottomSheetTextEditorButton';
import type { TextAndSelection } from './BottomSheetTextEditorTypes';
import type { RichTextASTTags } from '@azzapp/shared/richText/richTextTypes';

type RichTextButtonsProps = {
  onPress: (tag: RichTextASTTags) => void;
  isFocused: boolean;
  textAndSelection: TextAndSelection;
  enabledButtons?: RichTextASTTags[];
};

export const titleButtons: RichTextASTTags[] = ['+6', '-6'];
export const textButtons: RichTextASTTags[] = ['+3', '-3', 'i', 'b', 'c'];

const RichTextButtons = ({
  onPress,
  isFocused,
  textAndSelection,
  enabledButtons,
}: RichTextButtonsProps) => {
  return (
    <View style={styles.container}>
      <ScrollView
        keyboardShouldPersistTaps="always"
        horizontal
        style={styles.scrollView}
        scrollEnabled={false}
      >
        <View style={styles.buttonContainer}>
          <BottomSheetTextEditorButton
            onPress={onPress}
            textAndSelection={textAndSelection}
            tag="b"
            icon="bold"
            isFocused={isFocused}
            enabledButtons={enabledButtons}
          />
          <BottomSheetTextEditorButton
            onPress={onPress}
            textAndSelection={textAndSelection}
            tag="i"
            icon="italic"
            isFocused={isFocused}
            enabledButtons={enabledButtons}
          />
          <BottomSheetTextEditorButton
            onPress={onPress}
            textAndSelection={textAndSelection}
            tag="c"
            icon="underline"
            isFocused={isFocused}
            enabledButtons={enabledButtons}
          />
          <BottomSheetTextEditorButton
            onPress={onPress}
            textAndSelection={textAndSelection}
            tag="-3"
            icon="font_decrease"
            isFocused={isFocused}
            iconSize={20}
            enabledButtons={enabledButtons}
          />
          <BottomSheetTextEditorButton
            onPress={onPress}
            textAndSelection={textAndSelection}
            tag="+3"
            icon="font_increase"
            isFocused={isFocused}
            iconSize={20}
            enabledButtons={enabledButtons}
          />
          <BottomSheetTextEditorButton
            onPress={onPress}
            textAndSelection={textAndSelection}
            tag="-6"
            icon="font_decrease"
            isFocused={isFocused}
            iconSize={20}
            enabledButtons={enabledButtons}
          />
          <BottomSheetTextEditorButton
            onPress={onPress}
            textAndSelection={textAndSelection}
            tag="+6"
            icon="font_increase"
            isFocused={isFocused}
            iconSize={20}
            enabledButtons={enabledButtons}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10 },
  scrollView: {
    alignSelf: 'center',
    height: 32,
  },
  buttonContainer: {
    gap: 15,
    height: 32,
    flexDirection: 'row',
    alignSelf: 'center',
  },
});

export default memo(RichTextButtons);
