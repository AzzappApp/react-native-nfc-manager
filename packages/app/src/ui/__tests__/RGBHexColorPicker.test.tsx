import '@testing-library/jest-native/extend-expect';
import { render, act, fireEvent, screen } from '#helpers/testHelpers';
import RGBHexColorPicker from '#ui/ColorPicker/RGBHexColorPicker';

describe('RGBHexColorPicker component', () => {
  test('should call `onChange` with correct hex when changing red value', async () => {
    const mockOnChange = jest.fn();
    render(
      <RGBHexColorPicker
        hue={170}
        value={[0.41, 0.53]}
        onChange={mockOnChange}
      />,
    );

    act(() => {
      fireEvent.changeText(screen.getByTestId('red'), '12');
    });

    expect(mockOnChange).toBeCalledWith('#0c877e');
  });

  test('should call `onChange` with correct hex when changing green value', async () => {
    const mockOnChange = jest.fn();
    render(
      <RGBHexColorPicker
        hue={170}
        value={[0.41, 0.53]}
        onChange={mockOnChange}
      />,
    );

    act(() => {
      fireEvent.changeText(screen.getByTestId('green'), '12');
    });

    expect(mockOnChange).toBeCalledWith('#500c7e');
  });

  test('should call `onChange` with correct hex when changing blue value', async () => {
    const mockOnChange = jest.fn();
    render(
      <RGBHexColorPicker
        hue={170}
        value={[0.41, 0.53]}
        onChange={mockOnChange}
      />,
    );

    act(() => {
      fireEvent.changeText(screen.getByTestId('blue'), '12');
    });

    expect(mockOnChange).toBeCalledWith('#50870c');
  });

  test('should not call `onChange` if the entered value is not correct', async () => {
    const mockOnChange = jest.fn();
    render(
      <RGBHexColorPicker
        hue={170}
        value={[0.41, 0.53]}
        onChange={mockOnChange}
      />,
    );

    act(() => {
      fireEvent.changeText(screen.getByTestId('blue'), '');
    });

    expect(mockOnChange).not.toBeCalled();
  });
});
