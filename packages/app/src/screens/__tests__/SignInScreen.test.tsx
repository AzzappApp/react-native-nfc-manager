import { getLocales } from '#helpers/localeHelpers';
import { act, fireEvent, render, screen, waitFor } from '#helpers/testHelpers';
import '@testing-library/jest-native/extend-expect';
import SignInScreen from '../SignInScreen';

jest.mock('./#helpers/localeHelpers', () => ({ getLocales: jest.fn() }));

describe('Signin Screen', () => {
  const signin = jest.fn();
  beforeEach(() => {
    // @ts-expect-error mock implementation
    getLocales.mockImplementation(() => [
      {
        languageCode: 'fr',
        countryCode: 'fr',
        languageTag: 'fr',
        isRTL: true,
      },
    ]);
    signin.mockReset();
  });
  test('Login button should be `disabled` if both credential (phone number or email) and password are empty', () => {
    const { queryByRole } = render(<SignInScreen signin={signin} />);
    const buttonComponent = queryByRole('button');
    expect(buttonComponent).toBeDisabled();
  });

  test('should not call the `signin` callback if (phone number or email) and password are empty', () => {
    render(<SignInScreen signin={signin} />);
    const buttonComponent = screen.getByTestId(
      'azzapp_Button_pressable-wrapper',
    );
    act(() => fireEvent(buttonComponent, 'onPress'));
    expect(signin).not.toHaveBeenCalled();
  });

  test('Login button should be `disabled` and should not call the `signin` callback if credential (phone number or email) is empty and password filled', () => {
    const { queryByRole, getByPlaceholderText } = render(
      <SignInScreen signin={signin} />,
    );
    const input = getByPlaceholderText('Password');
    act(() => fireEvent(input, 'onChangeText', 'myPassword'));
    expect(input.props.value).toBe('myPassword');
    const buttonComponent = queryByRole('button');
    expect(buttonComponent).toBeDisabled();
    expect(signin).not.toHaveBeenCalled();
  });

  test('should call `signin` callback if an email for credential and password are filled', async () => {
    const { getByRole, getByPlaceholderText } = render(
      <SignInScreen signin={signin} />,
    );
    const inputLogin = getByPlaceholderText('Phone number or email address');
    act(() => fireEvent(inputLogin, 'onChangeText', 'seb@seb.com'));

    const input = getByPlaceholderText('Password');
    act(() => fireEvent(input, 'onChangeText', 'AZEqsd81'));

    const buttonComponent = getByRole('button');
    act(() => fireEvent(buttonComponent, 'onPress'));
    await waitFor(() => expect(signin).toHaveBeenCalled());
  });

  test('should call `signin` callback if a phone number for credential and password are filled', async () => {
    const { getByRole, getByPlaceholderText } = render(
      <SignInScreen signin={signin} />,
    );
    const inputLogin = getByPlaceholderText('Phone number or email address');
    act(() => fireEvent(inputLogin, 'onChangeText', '+33669696969'));

    const input = getByPlaceholderText('Password');
    act(() => fireEvent(input, 'onChangeText', 'AZEqsd81'));

    const buttonComponent = getByRole('button');
    act(() => fireEvent(buttonComponent, 'onPress'));
    await waitFor(() => expect(signin).toHaveBeenCalled());
  });

  test('Login button should be `disabled` if email is not well formatted ', () => {
    const { getByPlaceholderText, queryByRole } = render(
      <SignInScreen signin={signin} />,
    );
    const buttonComponent = queryByRole('button');
    const inputLogin = getByPlaceholderText('Phone number or email address');
    act(() => fireEvent(inputLogin, 'onChangeText', 'seb@com'));
    const input = getByPlaceholderText('Password');
    act(() => fireEvent(input, 'onChangeText', 'AZEqsd81'));
    expect(buttonComponent).toBeDisabled();
  });

  test('Login button should be `disabled` if phone number is not well formatted ', () => {
    const { getByPlaceholderText, queryByRole } = render(
      <SignInScreen signin={signin} />,
    );
    const buttonComponent = queryByRole('button');
    const inputLogin = getByPlaceholderText('Phone number or email address');
    act(() => fireEvent(inputLogin, 'onChangeText', '+336234234'));
    const input = getByPlaceholderText('Password');
    act(() => fireEvent(input, 'onChangeText', 'AZEqsd81'));
    expect(buttonComponent).toBeDisabled();
  });

  test('Login button should be `enable` if password contaians at least one character', () => {
    const { getByPlaceholderText, queryByRole } = render(
      <SignInScreen signin={signin} />,
    );
    const buttonComponent = queryByRole('button');
    const inputLogin = getByPlaceholderText('Phone number or email address');
    act(() => fireEvent(inputLogin, 'onChangeText', 'seb@seb.com'));
    const input = getByPlaceholderText('Password');
    act(() => fireEvent(input, 'onChangeText', 'azeqsd'));
    expect(buttonComponent).toBeEnabled();
  });

  test('should show error message is credentials are not valid', () => {
    const errorFunction = jest.fn(() => {
      throw new Error('INVALID_CRENDENTIALS');
    });
    const { getByPlaceholderText, getByRole } = render(
      <SignInScreen signin={errorFunction} />,
    );
    const buttonComponent = getByRole('button');
    const inputLogin = getByPlaceholderText('Phone number or email address');
    act(() => fireEvent(inputLogin, 'onChangeText', 'seb@seb.com'));
    const input = getByPlaceholderText('Password');
    act(() => fireEvent(input, 'onChangeText', 'AZEqsd81'));
    act(() => fireEvent.press(buttonComponent));
    expect(errorFunction).toThrowError();
    expect(screen.getByText('Invalid credentials')).not.toBeNull();
  });
});
