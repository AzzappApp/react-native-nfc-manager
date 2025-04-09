import { act } from '@testing-library/react-hooks';
import { renderHook } from '@testing-library/react-native';
import { generateHTMLFromRichText } from '@azzapp/shared/richText/stringToolbox';
import useRichTextManager from '#components/cardModules/tool/useRichTextManager';
import type {
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from 'react-native';

describe('BottomSheetTextEditor component', () => {
  test('simple value', () => {
    const { result } = renderHook(() =>
      useRichTextManager({
        id: 'ploup',
        defaultValue: 'abc',
        setText: () => {},
      }),
    );
    expect(generateHTMLFromRichText(result.current.textAndSelection.ast)).toBe(
      'abc',
    );
  });
  test('simple value with bold', () => {
    const { result } = renderHook(() =>
      useRichTextManager({
        id: 'ploup',
        defaultValue: '<b>abc</b>',
        setText: () => {},
      }),
    );
    expect(generateHTMLFromRichText(result.current.textAndSelection.ast)).toBe(
      '<b>abc</b>',
    );
  });
  test('change text call setText', async () => {
    const setText = jest.fn();
    const { result } = renderHook(() =>
      useRichTextManager({ id: 'ploup', defaultValue: '<b>abc</b>', setText }),
    );
    act(() => {
      result.current.onChangeText('test');
    });
    expect(setText).toHaveBeenCalledWith('<b>test</b>');
  });
  test('append text', async () => {
    const setText = jest.fn();
    const { result } = renderHook(() =>
      useRichTextManager({ id: 'ploup', defaultValue: '<b>abc</b>', setText }),
    );
    act(() => {
      result.current.onChangeText('abcd');
    });
    expect(setText).toHaveBeenCalledWith('<b>abcd</b>');
  });

  test('remove text', async () => {
    const setText = jest.fn();
    const { result } = renderHook(() =>
      useRichTextManager({ id: 'ploup', defaultValue: '<b>abc</b>', setText }),
    );
    act(() => {
      result.current.onChangeText('ab');
    });
    expect(setText).toHaveBeenCalledWith('<b>ab</b>');
  });
  test('clean text', async () => {
    const setText = jest.fn();
    const { result } = renderHook(() =>
      useRichTextManager({ id: 'ploup', defaultValue: '<b>abc</b>', setText }),
    );
    act(() => {
      result.current.onChangeText('');
    });
    expect(setText).toHaveBeenCalledWith('');
  });
  test('select and add a tag', async () => {
    const setText = jest.fn();
    const { result } = renderHook(() =>
      useRichTextManager({ id: 'ploup', defaultValue: '<b>abc</b>', setText }),
    );
    act(() => {
      result.current.onSelectionChange({
        nativeEvent: { selection: { start: 1, end: 2 } },
      } as NativeSyntheticEvent<TextInputSelectionChangeEventData>);
      result.current.onApplyTagPress('i');
    });

    expect(setText).toHaveBeenCalledWith('<b>a<i>b</i>c</b>');
  });
  test('copy/past', async () => {
    const setText = jest.fn();
    const { result } = renderHook(() =>
      useRichTextManager({ id: 'ploup', defaultValue: '<b>abc</b>', setText }),
    );
    act(() => {
      result.current.onSelectionChange({
        nativeEvent: { selection: { start: 1, end: 2 } },
      } as NativeSyntheticEvent<TextInputSelectionChangeEventData>);
      result.current.onChangeText('aTAGc');
    });
    expect(setText).toHaveBeenCalledWith('<b>aTAGc</b>');
  });
});
