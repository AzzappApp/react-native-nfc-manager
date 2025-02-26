import { useBottomSheetInternal } from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { checkRichTextASTCoherence } from '@azzapp/shared/richText//internalToolbox';
import {
  applyFormattingOnRichText,
  getTagsInSelectionFromRichText,
} from '@azzapp/shared/richText/formatting';
import {
  generateHTMLFromRichText,
  getRawTextFromRichText,
  parseHTMLToRichText,
} from '@azzapp/shared/richText/stringToolbox';
import {
  addTextInRichText,
  forceUpdateTextInRichText,
  removeTextInRichText,
  updateTextInRichText,
} from '@azzapp/shared/richText/stringUpdate';
import { colors } from '#theme';
import { RichTextFromAST } from '#components/ui/RichText';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';

import BottomSheetTextEditorButton from './BottomSheetTextEditorButton';
import TextInput from './TextInput';
import type {
  SelectionType,
  TextAndSelection,
} from './BottomSheetTextEditorTypes';
import type { RichTextASTTags } from '@azzapp/shared/richText/richTextTypes';
import type { ForwardedRef } from 'react';
import type {
  TextInputProps,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  TextInput as NativeTextInput,
  TextInputSelectionChangeEventData,
} from 'react-native';

export type BottomSheetTextEditorProps = Pick<
  TextInputProps,
  | 'defaultValue'
  | 'multiline'
  | 'onBlur'
  | 'onChangeText'
  | 'onFocus'
  | 'placeholder'
  | 'style'
>;

const DEBUG_EDITOR = false;

/**
 * A wrapper around TextInput that adds Azzapp's default styling.
 *
 */
const BottomSheetTextEditor = (
  {
    onFocus,
    onBlur,
    defaultValue,
    onChangeText,
    ...props
  }: BottomSheetTextEditorProps,
  ref: ForwardedRef<NativeTextInput>,
) => {
  const styles = useStyleSheet(styleSheet);

  //this should always be accessible, if not we will create an custom component for bottomSheet custom text input
  const { shouldHandleKeyboardEvents } = useBottomSheetInternal();
  //#endregion
  const [isFocused, setIsFocused] = useState(false);

  const [textAndSelection, setTextAndSelection] = useState<TextAndSelection>(
    () => ({
      ast: parseHTMLToRichText(defaultValue || ''),
      selectedTag: [],
    }),
  );

  const selection = useRef<SelectionType>({
    start: textAndSelection.ast.end,
    end: textAndSelection.ast.end,
  });

  // Save the last known text value
  const previousText = useRef<string>(
    getRawTextFromRichText(textAndSelection.ast),
  );

  const onFocusInner = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    shouldHandleKeyboardEvents.value = true;
    setIsFocused(true);
    onFocus?.(e);
  };

  const onBlurInner = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    shouldHandleKeyboardEvents.value = false;
    setIsFocused(false);
    onBlur?.(e);
  };

  const onSelectionChange = (
    e: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
  ) => {
    selection.current = e.nativeEvent.selection;
    const selectedTag =
      selection.current.start !== selection.current.end
        ? getTagsInSelectionFromRichText(
            textAndSelection.ast,
            selection.current.start,
            selection.current.end,
          )
        : [];
    setTextAndSelection(newAst => ({
      ast: newAst.ast,
      selection: selection.current,
      selectedTag,
    }));
  };

  //#region effects
  useEffect(() => {
    return () => {
      // Reset the flag on unmount
      shouldHandleKeyboardEvents.value = false;
    };
  }, [shouldHandleKeyboardEvents]);
  //#endregion

  /**
   * Apply a formatting to the selected text
   * @param tag tag to add
   */
  const onPress = (tag: RichTextASTTags) => {
    const formattedAST = applyFormattingOnRichText(
      textAndSelection.ast,
      selection.current?.start ?? textAndSelection.ast.end,
      selection.current?.end ?? textAndSelection.ast.end,
      tag,
    );

    if (DEBUG_EDITOR && !checkRichTextASTCoherence(formattedAST!)) {
      console.error('invalid AST');
    }
    const selectedTag =
      selection.current.start !== selection.current.end
        ? getTagsInSelectionFromRichText(
            formattedAST,
            selection.current.start,
            selection.current.end,
          )
        : [];
    setTextAndSelection({
      ast: formattedAST!,
      selection: selection.current,
      selectedTag,
    });
    onChangeText?.(formattedAST ? generateHTMLFromRichText(formattedAST) : '');
  };

  /**
   * call back received when text content change.
   * We try to be intelligent in this function
   */
  const onChangeTextInner = useCallback(
    (newText: string) => {
      const _selection = {
        start: selection.current.start,
        end: selection.current.end,
      };

      let newSelection;
      let newAST = textAndSelection.ast;
      const textLengthChange = newText.length - previousText.current.length;

      /**
       * user already have a selected range
       */
      if (_selection.start !== _selection.end) {
        // text has been added
        if (textLengthChange >= 0) {
          // Remove text and append new text after selection
          const changedText = newText.slice(
            _selection.start,
            _selection.end + textLengthChange,
          );
          newAST = updateTextInRichText(
            textAndSelection.ast,
            _selection.start,
            _selection.end,
            changedText,
          );
        } else {
          // remove text in selection and add again in case of past content
          newAST = removeTextInRichText(
            newAST,
            Math.max(_selection.end + textLengthChange, 0),
            -textLengthChange,
          );
          const replacedTextLength =
            _selection.end - _selection.start + textLengthChange;

          if (replacedTextLength > 0) {
            newAST = updateTextInRichText(
              newAST,
              _selection.start,
              _selection.end + textLengthChange,
              newText.slice(
                _selection.start,
                _selection.start + replacedTextLength,
              ),
            );
          } else if (DEBUG_EDITOR) {
            console.warn('No replace Text !');
          }
        }
        // update selection
        newSelection = { start: _selection.start, end: _selection.end };
      } else if (textLengthChange > 0) {
        // new text added append it after selection (can be multiple character if it is a past)
        newAST = addTextInRichText(
          newAST,
          newText.substring(
            _selection.start,
            _selection.start + textLengthChange,
          ),
          _selection.start,
        );
        newSelection = {
          start: _selection.start + textLengthChange,
          end: _selection.start + textLengthChange,
        };
      } else if (textLengthChange < 0) {
        // text removed case (should normally be only 1 character)
        newAST = removeTextInRichText(
          newAST,
          _selection.start + textLengthChange,
          -textLengthChange,
        );
        newSelection = {
          start: _selection.start + textLengthChange,
          end: _selection.start + textLengthChange,
        };
      } else {
        // in some case, the text field may change few character before the cursor,
        // let find them and replace them.
        // here we are sur the new previous length are equals
        let foundDiffLength = 0;
        while (
          newText[selection.current.end - foundDiffLength - 1] !==
          previousText.current[selection.current.end - foundDiffLength - 1]
        ) {
          foundDiffLength++;
        }
        if (foundDiffLength > 0) {
          newAST = updateTextInRichText(
            newAST,
            _selection.end - foundDiffLength,
            _selection.end,
            newText.slice(_selection.end - foundDiffLength, _selection.end),
          );
        } else if (DEBUG_EDITOR) console.warn('no update');
        newSelection = {
          start: _selection.start - foundDiffLength,
          end: _selection.start - foundDiffLength,
        };
      }
      if (DEBUG_EDITOR && !checkRichTextASTCoherence(newAST)) {
        console.error('invalid AST');
      }
      const rawText = getRawTextFromRichText(newAST);
      if (newText !== rawText) {
        if (newText.length === rawText.length) {
          // Both text have the same length but they are different.
          // This is a corner case when typing very rapidly (native issue ?).
          // So in worst fallback case, we just replace the content string by forcing it
          forceUpdateTextInRichText(newAST, newText);
        } else if (DEBUG_EDITOR)
          console.warn(
            `There is an issue, newText received: ${newText} !== generated text: "${getRawTextFromRichText(newAST)}"`,
          );
      }
      previousText.current = newText;
      setTextAndSelection({
        ast: newAST,
        selection: newSelection,
        selectedTag: [],
      });
      onChangeText?.(newAST ? generateHTMLFromRichText(newAST) : '');
    },
    [textAndSelection, onChangeText],
  );

  return (
    <View style={styles.inputContainer}>
      <TextInput
        {...props}
        ref={ref}
        onFocus={onFocusInner}
        onBlur={onBlurInner}
        onSelectionChange={onSelectionChange}
        onChangeText={onChangeTextInner}
        selection={textAndSelection.selection}
        value={undefined}
        defaultValue={undefined}
        testID="BottomSheetTextEditorId"
      >
        <RichTextFromAST node={textAndSelection.ast} />
      </TextInput>
      <View>
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
            />
            <BottomSheetTextEditorButton
              onPress={onPress}
              textAndSelection={textAndSelection}
              tag="i"
              icon="italic"
              isFocused={isFocused}
            />
            <BottomSheetTextEditorButton
              onPress={onPress}
              textAndSelection={textAndSelection}
              tag="c"
              icon="underline"
              isFocused={isFocused}
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  inputContainer: {
    gap: 10,
    flex: 1,
    paddingBottom: 10,
  },
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
  button: {
    width: 54,
    borderRadius: 33,
    borderColor: appearance === 'dark' ? colors.grey900 : colors.grey50,
    borderWidth: 1,
    height: '100%',
  },
  buttonDisable: {
    tintColor: appearance === 'dark' ? colors.grey800 : colors.grey200,
  },
  buttonSelected: {
    backgroundColor: appearance === 'dark' ? colors.grey900 : colors.grey50,
  },
}));

export default forwardRef(BottomSheetTextEditor);
