import { fireEvent, render, screen } from '@testing-library/react-native';
import TextInputWithEllipsizeMode from '../TextInputWithEllipsizeMode';

const mockedUseColorScheme = jest.fn();

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => {
  return {
    default: mockedUseColorScheme,
  };
});

describe('TextInputWithEllipsizeMode', () => {
  test('empty component', () => {
    render(<TextInputWithEllipsizeMode />);
    expect(screen).toMatchSnapshot();
  });
  test('component with value', () => {
    render(<TextInputWithEllipsizeMode value="test" />);
    expect(screen).toMatchSnapshot();
  });
  test('component change text value', () => {
    const component = render(<TextInputWithEllipsizeMode value="test" />);
    const inputText = component.getByTestId('nativeInputText');
    fireEvent.changeText(inputText, 'text');
    expect(screen).toMatchSnapshot();
  });
});
