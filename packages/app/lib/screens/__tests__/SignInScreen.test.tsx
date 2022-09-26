import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from '../../../utils/test-util';

import SignInScreen from '../SignInScreen';

describe('Signin Screen', () => {
  const signin = jest.fn();
  beforeEach(() => {
    signin.mockReset();
  });
  test('should render without error', () => {
    const { container } = render(<SignInScreen signin={signin} />);
    expect(container).not.toBeNull();
  });

  test('should not call the `signin` callback if usernameOrEmail and password are empty', () => {
    render(<SignInScreen signin={signin} />);
    const buttonComponent = screen.queryByTestId(
      'azzapp_Button_pressable-wrapper',
    );

    fireEvent(buttonComponent, 'onPress');
    expect(signin).not.toHaveBeenCalled();

    expect(
      within(
        screen.queryByTestId('azzapp_SignIn_textInput-usernameOrEmail'),
      ).queryByTestId('azzapp__Input__error-label'),
    ).not.toBeNull();

    expect(
      within(
        screen.queryByTestId('azzapp_SignIn_textInput-password'),
      ).queryByTestId('azzapp__Input__error-label'),
    ).not.toBeNull();
  });

  test('should not call the `signin` callback if usernameOrEmail is empty and password filled', () => {
    const { queryByTestId, queryByPlaceholderText } = render(
      <SignInScreen signin={signin} />,
    );

    const input = queryByPlaceholderText('Password');
    act(() => fireEvent(input, 'onChangeText', 'myPassword'));
    expect(input.props.value).toBe('myPassword');

    const buttonComponent = queryByTestId('azzapp_Button_pressable-wrapper');
    fireEvent(buttonComponent, 'onPress');
    expect(signin).not.toHaveBeenCalled();

    expect(
      within(
        screen.queryByTestId('azzapp_SignIn_textInput-usernameOrEmail'),
      ).queryByTestId('azzapp__Input__error-label'),
    ).not.toBeNull();

    expect(
      within(
        screen.queryByTestId('azzapp_SignIn_textInput-password'),
      ).queryByTestId('azzapp__Input__error-label'),
    ).toBeNull();
  });

  test('should not call the `signin` callback if password is empty and usernameOrEmail filled', () => {
    const { queryByTestId, queryByPlaceholderText } = render(
      <SignInScreen signin={signin} />,
    );
    const input = queryByPlaceholderText('Email Address');
    fireEvent(input, 'onChangeText', 'myTestUserName');
    expect(input.props.value).toBe('myTestUserName');

    const buttonComponent = queryByTestId('azzapp_Button_pressable-wrapper');
    fireEvent(buttonComponent, 'onPress');
    expect(signin).not.toHaveBeenCalled();

    expect(
      within(
        screen.queryByTestId('azzapp_SignIn_textInput-usernameOrEmail'),
      ).queryByTestId('azzapp__Input__error-label'),
    ).toBeNull();

    expect(
      within(
        screen.queryByTestId('azzapp_SignIn_textInput-password'),
      ).queryByTestId('azzapp__Input__error-label'),
    ).not.toBeNull();
  });

  test('`signin` callback should be call if usernameOrEmail and password are not empty', () => {
    const { queryByTestId, queryByPlaceholderText } = render(
      <SignInScreen signin={signin} />,
    );
    const inputLogin = queryByPlaceholderText('Email Address');
    fireEvent(inputLogin, 'onChangeText', 'myTestUserName');

    const input = queryByPlaceholderText('Password');
    fireEvent(input, 'onChangeText', 'myPassword');

    const buttonComponent = queryByTestId('azzapp_Button_pressable-wrapper');
    fireEvent(buttonComponent, 'onPress');
    expect(signin).toHaveBeenCalled();
    expect(
      within(
        screen.queryByTestId('azzapp_SignIn_textInput-usernameOrEmail'),
      ).queryByTestId('azzapp__Input__error-label'),
    ).toBeNull();

    expect(
      within(
        screen.queryByTestId('azzapp_SignIn_textInput-password'),
      ).queryByTestId('azzapp__Input__error-label'),
    ).toBeNull();
  });
});
