import { useBottomSheetInternal } from '@gorhom/bottom-sheet';
import { forwardRef, useEffect } from 'react';
import { defaultFontSize, RichTextFromAST } from '#components/ui/RichText';

import TextInput from './TextInput';
import type { TextAndSelection } from './BottomSheetTextEditorTypes';
import type { ForwardedRef } from 'react';
import type {
  TextInputProps,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  TextInput as NativeTextInput,
} from 'react-native';

export type BottomSheetTextEditorProps = Pick<
  TextInputProps,
  | 'multiline'
  | 'onBlur'
  | 'onChangeText'
  | 'onFocus'
  | 'onSelectionChange'
  | 'placeholder'
  | 'style'
> & { textAndSelection: TextAndSelection };

/**
 * A wrapper around TextInput that adds Azzapp's default styling.
 *
 */
const BottomSheetTextEditor = (
  {
    onFocus,
    onBlur,
    onChangeText,
    textAndSelection,
    onSelectionChange,
    ...props
  }: BottomSheetTextEditorProps,
  ref: ForwardedRef<NativeTextInput>,
) => {
  //this should always be accessible, if not we will create an custom component for bottomSheet custom text input
  const { shouldHandleKeyboardEvents } = useBottomSheetInternal();

  const onFocusInner = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    shouldHandleKeyboardEvents.value = true;
    onFocus?.(e);
  };

  const onBlurInner = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    shouldHandleKeyboardEvents.value = false;
    onBlur?.(e);
  };

  //#region effects
  useEffect(() => {
    return () => {
      // Reset the flag on unmount
      shouldHandleKeyboardEvents.value = false;
    };
  }, [shouldHandleKeyboardEvents]);
  //#endregion

  return (
    <TextInput
      {...props}
      ref={ref}
      onFocus={onFocusInner}
      onBlur={onBlurInner}
      onSelectionChange={onSelectionChange}
      onChangeText={onChangeText}
      selection={textAndSelection.selection}
      testID="BottomSheetTextEditorId"
    >
      <RichTextFromAST
        node={textAndSelection.ast}
        fontSize={defaultFontSize}
        forceFontResizeValue={3}
      />
    </TextInput>
  );
};

export default forwardRef(BottomSheetTextEditor);
