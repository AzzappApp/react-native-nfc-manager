import { useBottomSheetInternal } from '@gorhom/bottom-sheet';
import { forwardRef, useEffect } from 'react';
import TextInput from './TextInput';
import type { ForwardedRef } from 'react';
import type {
  TextInputProps as NativeTextInputProps,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  TextInput as NativeTextInput,
} from 'react-native';

export type TextInputProps = NativeTextInputProps & {
  /**
   * Whether the input is in error state
   */
  isErrored?: boolean;
};

/**
 * A wrapper around TextInput that adds Azzapp's default styling.
 *
 */
const BottomSheetTextInput = (
  { onFocus, onBlur, ...props }: TextInputProps,
  ref: ForwardedRef<NativeTextInput>,
) => {
  //this should always be accessible, if not we will create an custom component for bottomSheet custom text input
  const { shouldHandleKeyboardEvents } = useBottomSheetInternal();
  //#endregion

  const onFocusInner = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    shouldHandleKeyboardEvents.set(true);
    onFocus?.(e);
  };

  const onBlurInner = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    shouldHandleKeyboardEvents.set(false);
    onBlur?.(e);
  };

  //#region effects
  useEffect(() => {
    return () => {
      // Reset the flag on unmount
      shouldHandleKeyboardEvents.set(false);
    };
  }, [shouldHandleKeyboardEvents]);
  //#endregion

  return (
    <TextInput
      {...props}
      onFocus={onFocusInner}
      onBlur={onBlurInner}
      ref={ref}
    />
  );
};

export default forwardRef(BottomSheetTextInput);
