import { fireEvent, render, screen } from '@testing-library/react-native';
import TextInputWithPrefix from '../TextInputWithPrefix';

const mockedUseColorScheme = jest.fn();

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => {
  return {
    default: mockedUseColorScheme,
  };
});

describe('TextInputWithPrefix', () => {
  test('empty component', () => {
    render(<TextInputWithPrefix />);
    expect(screen).toMatchSnapshot();
  });
  test('component with value', () => {
    render(<TextInputWithPrefix value="test" />);
    expect(screen).toMatchSnapshot();
  });
  test('component with value and prefix', () => {
    render(<TextInputWithPrefix value="test" prefix="test" />);
    expect(screen).toMatchSnapshot();
  });
  test('component change text value', () => {
    const component = render(<TextInputWithPrefix value="test" />);
    const inputText = component.getByTestId('nativeInputText');
    fireEvent.changeText(inputText, 'text');
    expect(screen).toMatchSnapshot();
  });
});
