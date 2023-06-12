import { render, fireEvent } from '@testing-library/react-native';
import { colors } from '#theme';
import RadioButton from '../RadioButton';

const mockedUseColorScheme = jest.fn();

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => {
  return {
    default: mockedUseColorScheme,
  };
});

describe('RadioButton', () => {
  const onChange = jest.fn();

  it('calls `onChange` prop when pressed', () => {
    const { getByRole } = render(
      <RadioButton checked={false} onChange={onChange} />,
    );
    const radio = getByRole('radio');
    fireEvent.press(radio);
    expect(onChange).toHaveBeenCalled();
  });

  it('renders as checked when checked prop is true', () => {
    const { getByRole } = render(
      <RadioButton checked={true} onChange={onChange} />,
    );
    const radio = getByRole('radio');
    expect(radio.props.accessibilityState.checked).toBe(true);
  });

  it('renders correctly with small variant and dark mode', () => {
    mockedUseColorScheme.mockReturnValue('dark');
    const { getByRole } = render(
      <RadioButton checked={false} onChange={onChange} variant="small" />,
    );
    const radio = getByRole('radio');
    expect(radio).toHaveStyle({
      borderWidth: 2,
      borderColor: colors.grey800,
      width: 14.4,
      backgroundColor: colors.white,
    });
  });
});
