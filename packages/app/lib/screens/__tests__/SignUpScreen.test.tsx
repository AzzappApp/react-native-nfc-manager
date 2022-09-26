import { fireEvent, render, within, screen } from '../../../utils/test-util';

import SignUpScreen from '../SignUpScreen';

describe('Signup Screen', () => {
  const signup = jest.fn();
  beforeEach(() => {
    signup.mockReset();
  });
  test('should render without error', () => {
    const { container } = render(<SignUpScreen signup={signup} />);
    expect(container).not.toBeNull();
  });

  test('should call the `signup` callback if form is valid', () => {
    const { queryByTestId, queryAllByTestId, queryByPlaceholderText } = render(
      <SignUpScreen signup={signup} />,
    );
    const inputLogin = queryByPlaceholderText('Email Address');
    fireEvent(inputLogin, 'onChangeText', 'test@azzaap.com');

    const input = queryByPlaceholderText('Password');
    fireEvent(input, 'onChangeText', 'AZEqsd81');

    const checkboxes = queryAllByTestId('azzapp__CheckBox__view-wrapper');
    fireEvent(checkboxes[0], 'onPress');
    fireEvent(checkboxes[1], 'onPress');

    const buttonComponent = queryByTestId('azzapp_Button_pressable-wrapper');
    fireEvent(buttonComponent, 'onPress');
    expect(signup).toHaveBeenCalled();

    expect(
      within(
        screen.queryByTestId('azzapp_SignUp_textInput-email'),
      ).queryByTestId('azzapp__Input__error-label'),
    ).toBeNull();
    expect(
      within(
        screen.queryByTestId('azzapp_SignUp_textInput-password'),
      ).queryByTestId('azzapp__Input__error-label'),
    ).toBeNull();
    expect(screen.queryByTestId('azzapp_SignUp_textInput-errorTos')).toBeNull();
  });

  test('should not call the `signup` callback if email is not valid', () => {
    const { queryByTestId, queryAllByTestId, queryByPlaceholderText } = render(
      <SignUpScreen signup={signup} />,
    );
    const inputLogin = queryByPlaceholderText('Email Address');
    fireEvent(inputLogin, 'onChangeText', 'test@com');

    const input = queryByPlaceholderText('Password');
    fireEvent(input, 'onChangeText', 'AZEqsd81');

    const checkboxes = queryAllByTestId('azzapp__CheckBox__view-wrapper');
    fireEvent(checkboxes[0], 'onPress');
    fireEvent(checkboxes[1], 'onPress');
    const buttonComponent = queryByTestId('azzapp_Button_pressable-wrapper');
    fireEvent(buttonComponent, 'onPress');
    expect(signup).not.toHaveBeenCalled();

    expect(
      within(
        screen.queryByTestId('azzapp_SignUp_textInput-email'),
      ).queryByTestId('azzapp__Input__error-label'),
    ).not.toBeNull();
    expect(
      within(
        screen.queryByTestId('azzapp_SignUp_textInput-password'),
      ).queryByTestId('azzapp__Input__error-label'),
    ).toBeNull();
    expect(screen.queryByTestId('azzapp_SignUp_textInput-errorTos')).toBeNull();
  });

  test('should not call the `signup` callback if password is not valid', () => {
    const { queryByTestId, queryAllByTestId, queryByPlaceholderText } = render(
      <SignUpScreen signup={signup} />,
    );
    const inputLogin = queryByPlaceholderText('Email Address');
    fireEvent(inputLogin, 'onChangeText', 'test@azzaap.com');

    const input = queryByPlaceholderText('Password');
    fireEvent(input, 'onChangeText', 'wonrpsdfsdfass');

    const checkboxes = queryAllByTestId('azzapp__CheckBox__view-wrapper');

    fireEvent(checkboxes[0], 'onPress');
    fireEvent(checkboxes[1], 'onPress');
    const buttonComponent = queryByTestId('azzapp_Button_pressable-wrapper');
    fireEvent(buttonComponent, 'onPress');
    expect(signup).not.toHaveBeenCalled();

    expect(
      within(
        screen.queryByTestId('azzapp_SignUp_textInput-email'),
      ).queryByTestId('azzapp__Input__error-label'),
    ).toBeNull();
    expect(
      within(
        screen.queryByTestId('azzapp_SignUp_textInput-password'),
      ).queryByTestId('azzapp__Input__error-label'),
    ).not.toBeNull();
    expect(screen.queryByTestId('azzapp_SignUp_textInput-errorTos')).toBeNull();
  });

  test('should not call the `signup` callback if TOS is not checked', () => {
    const { queryByTestId, queryAllByTestId, queryByPlaceholderText } = render(
      <SignUpScreen signup={signup} />,
    );
    const inputLogin = queryByPlaceholderText('Email Address');
    fireEvent(inputLogin, 'onChangeText', 'test@azzaap.com');

    const input = queryByPlaceholderText('Password');
    fireEvent(input, 'onChangeText', 'AZEqsd81');

    const checkboxes = queryAllByTestId('azzapp__CheckBox__view-wrapper');
    fireEvent(checkboxes[1], 'onPress');
    const buttonComponent = queryByTestId('azzapp_Button_pressable-wrapper');
    fireEvent(buttonComponent, 'onPress');
    expect(signup).not.toHaveBeenCalled();

    expect(
      within(
        screen.queryByTestId('azzapp_SignUp_textInput-email'),
      ).queryByTestId('azzapp__Input__error-label'),
    ).toBeNull();
    expect(
      within(
        screen.queryByTestId('azzapp_SignUp_textInput-password'),
      ).queryByTestId('azzapp__Input__error-label'),
    ).toBeNull();
    expect(
      screen.queryByTestId('azzapp_SignUp_textInput-errorTos'),
    ).not.toBeNull();
  });

  test('should not call the `signup` callback if PP is not checked', () => {
    const { queryByTestId, queryAllByTestId, queryByPlaceholderText } = render(
      <SignUpScreen signup={signup} />,
    );
    const inputLogin = queryByPlaceholderText('Email Address');
    fireEvent(inputLogin, 'onChangeText', 'test@azzaap.com');

    const input = queryByPlaceholderText('Password');
    fireEvent(input, 'onChangeText', 'AZEqsd81');

    const checkboxes = queryAllByTestId('azzapp__CheckBox__view-wrapper');

    fireEvent(checkboxes[0], 'onPress');
    const buttonComponent = queryByTestId('azzapp_Button_pressable-wrapper');
    fireEvent(buttonComponent, 'onPress');
    expect(signup).not.toHaveBeenCalled();

    expect(
      within(
        screen.queryByTestId('azzapp_SignUp_textInput-email'),
      ).queryByTestId('azzapp__Input__error-label'),
    ).toBeNull();
    expect(
      within(
        screen.queryByTestId('azzapp_SignUp_textInput-password'),
      ).queryByTestId('azzapp__Input__error-label'),
    ).toBeNull();
    expect(
      screen.queryByTestId('azzapp_SignUp_textInput-errorTos'),
    ).not.toBeNull();
  });

  test('should not call the `signup` callback if email empty', () => {
    const { queryByTestId, queryAllByTestId, queryByPlaceholderText } = render(
      <SignUpScreen signup={signup} />,
    );

    const input = queryByPlaceholderText('Password');
    fireEvent(input, 'onChangeText', 'AZEqsd81');

    const checkboxes = queryAllByTestId('azzapp__CheckBox__view-wrapper');

    fireEvent(checkboxes[0], 'onPress');
    fireEvent(checkboxes[1], 'onPress');
    const buttonComponent = queryByTestId('azzapp_Button_pressable-wrapper');
    fireEvent(buttonComponent, 'onPress');
    expect(signup).not.toHaveBeenCalled();

    expect(
      within(
        screen.queryByTestId('azzapp_SignUp_textInput-email'),
      ).queryByTestId('azzapp__Input__error-label'),
    ).not.toBeNull();
    expect(
      within(
        screen.queryByTestId('azzapp_SignUp_textInput-password'),
      ).queryByTestId('azzapp__Input__error-label'),
    ).toBeNull();
    expect(screen.queryByTestId('azzapp_SignUp_textInput-errorTos')).toBeNull();
  });

  test('should not call the `signup` callback if password empty', () => {
    const { queryByTestId, queryAllByTestId, queryByPlaceholderText } = render(
      <SignUpScreen signup={signup} />,
    );

    const input = queryByPlaceholderText('Email Address');
    fireEvent(input, 'onChangeText', 'test@azzaap.coms');

    const checkboxes = queryAllByTestId('azzapp__CheckBox__view-wrapper');

    fireEvent(checkboxes[0], 'onPress');
    fireEvent(checkboxes[1], 'onPress');
    const buttonComponent = queryByTestId('azzapp_Button_pressable-wrapper');
    fireEvent(buttonComponent, 'onPress');
    expect(signup).not.toHaveBeenCalled();

    expect(
      within(
        screen.queryByTestId('azzapp_SignUp_textInput-email'),
      ).queryByTestId('azzapp__Input__error-label'),
    ).toBeNull();
    expect(
      within(
        screen.queryByTestId('azzapp_SignUp_textInput-password'),
      ).queryByTestId('azzapp__Input__error-label'),
    ).not.toBeNull();
    expect(screen.queryByTestId('azzapp_SignUp_textInput-errorTos')).toBeNull();
  });
});
