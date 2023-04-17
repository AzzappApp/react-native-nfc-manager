import { render } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import { View } from 'react-native';
import { colors } from '#theme';
import Header, { HEADER_HEIGHT } from '../Header';

const mockedUseColorScheme = jest.fn();

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => {
  return {
    default: mockedUseColorScheme,
  };
});

describe('Header', () => {
  test('render correctly all element', () => {
    const middleElement = 'Hello, World!';
    const leftElement = <View testID="left-element" />;
    const rightElement = <View testID="right-element" />;
    const { getByText, getByTestId } = render(
      <Header
        middleElement={middleElement}
        leftElement={leftElement}
        rightElement={rightElement}
      />,
    );
    const middleText = getByText(middleElement);
    const left = getByTestId('left-element');
    const right = getByTestId('right-element');
    expect(middleText).toBeTruthy();
    expect(left).toBeTruthy();
    expect(right).toBeTruthy();
  });

  test('render correctly in dark mode', () => {
    mockedUseColorScheme.mockReturnValue('dark');
    const { getByTestId } = render(<Header testID="header-container" />);
    const container = getByTestId('header-container');

    expect(container).toHaveStyle({
      height: HEADER_HEIGHT,
      backgroundColor: colors.black,
    });
  });
});
