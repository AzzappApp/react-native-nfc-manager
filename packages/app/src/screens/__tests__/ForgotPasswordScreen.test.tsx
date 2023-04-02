import { fireEvent, render, act, cleanup, screen } from '#helpers/testHelpers';
import ForgotPasswordScreen from '../ForgotPasswordScreen';
import '@testing-library/jest-native/extend-expect';

jest.mock('#ui/ViewTransition', () => 'ViewTransition');

describe('ForgotPassword Screen', () => {
  const forgotPassword = jest.fn();
  beforeEach(() => {
    forgotPassword.mockReset();
  });

  test('should render and show the enter email ', () => {
    const { getByTestId } = render(
      <ForgotPasswordScreen forgotPassword={forgotPassword} />,
    );
    expect(
      getByTestId('azzapp__ForgotPasswordScreen__ViewTransition-email'),
    ).toHaveStyle({
      opacity: 1,
    });
    expect(
      getByTestId('azzapp__ForgotPasswordScreen__ViewTransition-confirm'),
    ).toHaveStyle({ opacity: 0 });
  });

  test('should call the `forgotPassword` callback when the form is submitted', () => {
    const { getByRole, getByPlaceholderText } = render(
      <ForgotPasswordScreen forgotPassword={forgotPassword} />,
    );
    const inputLogin = getByPlaceholderText('Phone number or email address');
    act(() => {
      fireEvent(inputLogin, 'onChangeText', 'test@azzaap.com');
    });

    const buttonComponent = getByRole('button');
    act(() => {
      fireEvent(buttonComponent, 'onPress');
    });
    expect(forgotPassword).toHaveBeenCalled();
    cleanup();
  });

  test('should not call the `forgotPassword` callback when the provided email is invalid', () => {
    const { getByRole, getByPlaceholderText } = render(
      <ForgotPasswordScreen forgotPassword={forgotPassword} />,
    );
    const inputLogin = getByPlaceholderText('Phone number or email address');
    act(() => {
      fireEvent(inputLogin, 'onChangeText', 'test@com');
    });

    const buttonComponent = getByRole('button');
    act(() => {
      fireEvent(buttonComponent, 'onPress');
    });
    expect(forgotPassword).not.toHaveBeenCalled();
    cleanup();
  });

  test('Change password button should be `disabled` when the provided email is invalid', () => {
    const { queryByRole, getByPlaceholderText } = render(
      <ForgotPasswordScreen forgotPassword={forgotPassword} />,
    );
    const inputLogin = getByPlaceholderText('Phone number or email address');
    act(() => fireEvent(inputLogin, 'onChangeText', 'test@com'));
    const ubutton = queryByRole('button');
    expect(ubutton).toBeDisabled();

    cleanup();
  });

  test('should display the confirmation message when a valid form is submitted', () => {
    jest.useFakeTimers();
    const { getByPlaceholderText, getByRole } = render(
      <ForgotPasswordScreen forgotPassword={forgotPassword} />,
    );

    const inputLogin = getByPlaceholderText('Phone number or email address');
    fireEvent(inputLogin, 'onChangeText', 'test@test.com');
    act(() => {
      fireEvent(getByRole('button'), 'onPress');
    });
    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(
      screen.queryByTestId(
        'azzapp__ForgotPasswordScreen__ViewTransition-confirm',
      ),
    ).toHaveStyle({
      opacity: 1,
    });

    expect(
      screen.queryByTestId(
        'azzapp__ForgotPasswordScreen__ViewTransition-email',
      ),
    ).toHaveStyle({
      opacity: 0,
    });
  });
});
