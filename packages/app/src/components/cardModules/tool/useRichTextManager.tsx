import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applyFormattingOnRichText,
  getTagsInSelectionFromRichText,
} from '@azzapp/shared/richText/formatting';
import { checkRichTextASTCoherence } from '@azzapp/shared/richText/internalToolbox';
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
import type {
  SelectionType,
  TextAndSelection,
} from '#ui/BottomSheetTextEditorTypes';
import type { RichTextASTTags } from '@azzapp/shared/richText/richTextTypes';
import type {
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from 'react-native';

type useRichTextManagerProps = {
  id: string;
  defaultValue?: string;
  setText: (arg: string) => void;
};

type useRichTextManagerResult = {
  onApplyTagPress: (tag: RichTextASTTags) => void;
  onSelectionChange: (
    e: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
  ) => void;
  onChangeText: (newText: string) => void;
  textAndSelection: TextAndSelection;
};
const DEBUG_EDITOR = false;

const useRichTextManager = ({
  id,
  defaultValue,
  setText,
}: useRichTextManagerProps): useRichTextManagerResult => {
  const [textAndSelection, setTextAndSelection] = useState<TextAndSelection>(
    () => ({
      ast: parseHTMLToRichText(defaultValue || ''),
      selectedTag: [],
    }),
  );
  // Sometime we receive 2 text change before the previous one is applied (Then the state is updated)
  // The ref is used to ensure we always have the last known AST
  const previousAST = useRef(textAndSelection.ast);

  const previousId = useRef<string>(id);
  useEffect(() => {
    if (previousId.current === id) {
      return;
    }
    previousId.current = id;
    previousAST.current = parseHTMLToRichText(defaultValue || '');
    setTextAndSelection({
      ast: previousAST.current,
      selectedTag: [],
    });
  }, [defaultValue, id]);

  const selection = useRef<SelectionType>({
    start: textAndSelection.ast.end,
    end: textAndSelection.ast.end,
  });

  // Save the last known text value
  const previousText = useRef<string>(
    getRawTextFromRichText(textAndSelection.ast),
  );

  /**
   * Apply a formatting to the selected text
   * @param tag tag to add
   */
  const onApplyTagPress = (tag: RichTextASTTags) => {
    const formattedAST = applyFormattingOnRichText(
      previousAST.current,
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
    previousAST.current = formattedAST;
    setTextAndSelection({
      ast: formattedAST,
      selection: selection.current,
      forceSelection: true,
      selectedTag,
    });
    setText(formattedAST ? generateHTMLFromRichText(formattedAST) : '');
  };

  /**
   * Callback to Handle selection change
   */
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
    setTextAndSelection(newAst => {
      if (
        newAst.selection?.end !== selection.current.end ||
        newAst.selection?.start !== selection.current.start
      ) {
        return {
          ast: newAst.ast,
          selection: selection.current,
          selectedTag,
        };
      } else return newAst;
    });
  };
  /**
   * call back received when text content change.
   * We try to be intelligent in this function
   */
  const onChangeText = useCallback(
    (newText: string) => {
      const _selection = {
        start: selection.current.start,
        end: selection.current.end,
      };

      let newSelection;
      let newAST = previousAST.current;
      const textLengthChange = newText.length - previousText.current.length;

      if (getRawTextFromRichText(newAST) === newText) {
        // we receive the same text than the already used
        return;
      }
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
            newAST,
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

      if (newSelection.start > newText.length) {
        newSelection.start = newText.length;
      }
      if (newSelection.end > newText.length) {
        newSelection.end = newText.length;
      }
      selection.current = newSelection;
      previousAST.current = newAST;

      setTextAndSelection({
        ast: newAST,
        selection: newSelection,
        selectedTag: [],
      });
      setText(newAST ? generateHTMLFromRichText(newAST) : '');
    },
    [setText],
  );

  return { onApplyTagPress, onSelectionChange, onChangeText, textAndSelection };
};

export default useRichTextManager;
