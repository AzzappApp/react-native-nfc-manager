import '@testing-library/jest-native/extend-expect';

import { render, screen, act, fireEvent } from '#helpers/testHelpers';
import HexColorTextInput from '../HexColorTextInput';

describe('HexColorTextInput component', () => {
  test('setting props `value` should render the correct backgroundColor', () => {
    render(<HexColorTextInput value="#2C73FA" onChangeColor={jest.fn()} />);
    const previewColor = screen.queryByTestId(
      'azzap_native_hexcolor_previewcolor',
    );
    expect(previewColor).toHaveStyle({ backgroundColor: '#2C73FA' });
    const inputV = screen.getByTestId('azzap_native_text_input');

    expect(inputV.props.value).toBe('#2C73FA');
  });

  test('calling on `onChange` with a wrong color should not change the preview color', () => {
    render(<HexColorTextInput value="#2C73FA" onChangeColor={jest.fn()} />);
    const previewColor = screen.queryByTestId(
      'azzap_native_hexcolor_previewcolor',
    );

    const inputV = screen.getByTestId('azzap_native_text_input');
    act(() => {
      fireEvent.changeText(inputV, '12');
    });
    expect(previewColor).toHaveStyle({ backgroundColor: '#2C73FA' });
    expect(inputV.props.value).toBe('#12');
  });
});
