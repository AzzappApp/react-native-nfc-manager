import { render, screen } from '@testing-library/react-native';
import BottomSheetTextEditorButton from '#ui/BottomSheetTextEditorButton';

describe('BottomSheetTextEditorButton component', () => {
  test('selected state', () => {
    render(
      <BottomSheetTextEditorButton
        onPress={() => {}}
        textAndSelection={{
          ast: {
            type: 'root',
            start: 0,
            end: 1,
            children: undefined,
            value: undefined,
          },
          selection: undefined,
          selectedTag: ['b'],
        }}
        tag="b"
        icon="link"
        isFocused
      />,
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });

  test('unselected state', () => {
    render(
      <BottomSheetTextEditorButton
        onPress={() => {}}
        textAndSelection={{
          ast: {
            type: 'root',
            start: 0,
            end: 1,
            children: undefined,
            value: undefined,
          },
          selection: undefined,
          selectedTag: [],
        }}
        tag="b"
        icon="link"
        isFocused
      />,
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });

  test('disabled state', () => {
    render(
      <BottomSheetTextEditorButton
        onPress={() => {}}
        textAndSelection={{
          ast: {
            type: 'root',
            start: 0,
            end: 1,
            children: undefined,
            value: undefined,
          },
          selection: undefined,
          selectedTag: [],
        }}
        tag="b"
        icon="link"
        isFocused={false}
      />,
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
