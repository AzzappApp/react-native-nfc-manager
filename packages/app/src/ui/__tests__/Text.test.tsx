import { render } from '@testing-library/react-native';
import { colors } from '#theme';
import Text from '../Text';

const mockedUseColorScheme = jest.fn();

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => {
  return {
    default: mockedUseColorScheme,
  };
});
const label = '{label}';
describe('Text component', () => {
  test('renders with correct color based on colorScheme', () => {
    mockedUseColorScheme.mockReturnValue('light');
    const { getByText, rerender } = render(<Text>{label}</Text>);
    const textElement = getByText(label);
    expect(textElement).toHaveStyle({ color: colors.black });
    mockedUseColorScheme.mockReturnValue('dark');
    rerender(<Text>{label}</Text>);
    expect(textElement).toHaveStyle({ color: colors.white });
  });

  test('props `style`should apply correcty', () => {
    const { getByText } = render(
      <Text style={{ fontSize: 20, color: colors.red400 }}>{label}</Text>,
    );
    const textElement = getByText(label);
    expect(textElement).toHaveStyle({ fontSize: 20 });
    expect(textElement).toHaveStyle({ color: colors.red400 });
  });

  test('props `variant` should apply correcty', () => {
    mockedUseColorScheme.mockReturnValue('light');
    const { getByText, rerender } = render(
      <Text variant="xlarge">{label}</Text>,
    );
    const textElement = getByText(label);
    expect(textElement).toHaveStyle({
      fontSize: 20,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: colors.black,
    });
    rerender(<Text variant="large">{label}</Text>);
    expect(textElement).toHaveStyle({
      fontSize: 16,
      fontFamily: 'PlusJakartaSans-Bold',
      color: colors.black,
    });
    rerender(<Text variant="textField">{label}</Text>);
    expect(textElement).toHaveStyle({
      fontSize: 16,
      fontFamily: 'PlusJakartaSans-Regular',
      color: colors.black,
    });
    rerender(<Text variant="button">{label}</Text>);
    expect(textElement).toHaveStyle({
      fontSize: 14,
      fontFamily: 'PlusJakartaSans-SemiBold',
      color: colors.black,
    });
    rerender(<Text variant="smallbold">{label}</Text>);
    expect(textElement).toHaveStyle({
      fontSize: 12,
      fontFamily: 'PlusJakartaSans-SemiBold',
      color: colors.black,
    });
    rerender(<Text variant="medium">{label}</Text>);
    expect(textElement).toHaveStyle({
      fontSize: 14,
      fontFamily: 'PlusJakartaSans-Medium',
      color: colors.black,
    });
    rerender(<Text variant="small">{label}</Text>);
    expect(textElement).toHaveStyle({
      fontSize: 12,
      fontFamily: 'PlusJakartaSans-Regular',
      color: colors.black,
    });
    rerender(<Text variant="error">{label}</Text>);
    expect(textElement).toHaveStyle({
      fontSize: 12,
      fontFamily: 'PlusJakartaSans-Regular',
      color: colors.red400,
    });
  });
});
