import { fireEvent, render, screen } from '@testing-library/react-native';
import BottomSheetTextEditor from '#ui/BottomSheetTextEditor';

describe('BottomSheetTextEditor component', () => {
  test('simple snapshot', () => {
    render(<BottomSheetTextEditor defaultValue="abc" />);
    expect(screen.toJSON()).toMatchSnapshot();
  });
  test('simple snapshot with bold', () => {
    render(<BottomSheetTextEditor defaultValue="<b>abc</b>" />);
    expect(screen.toJSON()).toMatchSnapshot();
  });
  test('snapshot after change text', async () => {
    const onChangeText = jest.fn();
    const component = render(
      <BottomSheetTextEditor
        defaultValue="<b>abc</b>"
        onChangeText={onChangeText}
      />,
    );
    const textInput = await component.findByTestId('BottomSheetTextEditorId');
    fireEvent.changeText(textInput, 'test');
    expect(screen.toJSON()).toMatchSnapshot();
    expect(onChangeText).toHaveBeenCalledWith('<b>test</b>');
  });
  test('snapshot after append text', async () => {
    const onChangeText = jest.fn();
    const component = render(
      <BottomSheetTextEditor
        defaultValue="<b>abc</b>"
        onChangeText={onChangeText}
      />,
    );
    const textInput = await component.findByTestId('BottomSheetTextEditorId');
    fireEvent.changeText(textInput, 'abcd');
    expect(screen.toJSON()).toMatchSnapshot();
    expect(onChangeText).toHaveBeenCalledWith('<b>abcd</b>');
  });

  test('snapshot after remove text', async () => {
    const onChangeText = jest.fn();
    const component = render(
      <BottomSheetTextEditor
        defaultValue="<b>abc</b>"
        onChangeText={onChangeText}
      />,
    );
    const textInput = await component.findByTestId('BottomSheetTextEditorId');
    fireEvent.changeText(textInput, 'ab');
    expect(screen.toJSON()).toMatchSnapshot();
    expect(onChangeText).toHaveBeenCalledWith('<b>ab</b>');
  });
  test('snapshot after clean text', async () => {
    const onChangeText = jest.fn();
    const component = render(
      <BottomSheetTextEditor
        defaultValue="<b>abc</b>"
        onChangeText={onChangeText}
      />,
    );
    const textInput = await component.findByTestId('BottomSheetTextEditorId');
    fireEvent.changeText(textInput, '');
    expect(screen.toJSON()).toMatchSnapshot();
    expect(onChangeText).toHaveBeenCalledWith('');
  });
});
