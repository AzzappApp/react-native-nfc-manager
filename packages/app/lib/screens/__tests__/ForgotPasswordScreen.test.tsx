import {
  fireEvent,
  render,
  act,
  cleanup,
  screen,
} from '../../../utils/test-util';
import ForgotPasswordScreen from '../ForgotPasswordScreen';
import '@testing-library/jest-native/extend-expect';

jest.mock('../../ui/ViewTransition', () => 'ViewTransition');

describe('ForgotPassword Screen', () => {
  const forgotPassword = jest.fn();
  beforeEach(() => {
    forgotPassword.mockReset();
  });

  test('should render and show the enter email ', () => {
    const { container, getByTestId } = render(
      <ForgotPasswordScreen forgotPassword={forgotPassword} />,
    );
    expect(container).not.toBeNull();
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
    const { queryByTestId, queryByPlaceholderText } = render(
      <ForgotPasswordScreen forgotPassword={forgotPassword} />,
    );
    const inputLogin = queryByPlaceholderText('Email Address');
    act(() => {
      fireEvent(inputLogin, 'onChangeText', 'test@azzaap.com');
    });

    const buttonComponent = queryByTestId('azzapp_Button_pressable-wrapper');
    act(() => {
      fireEvent(buttonComponent, 'onPress');
    });
    expect(forgotPassword).toHaveBeenCalled();
    cleanup();
  });

  test('should not call the `forgotPassword` callback when the provided email is invalid', () => {
    const { queryByTestId, queryByPlaceholderText } = render(
      <ForgotPasswordScreen forgotPassword={forgotPassword} />,
    );
    const inputLogin = queryByPlaceholderText('Email Address');
    act(() => {
      fireEvent(inputLogin, 'onChangeText', 'test@com');
    });

    const buttonComponent = queryByTestId('azzapp_Button_pressable-wrapper');
    act(() => {
      fireEvent(buttonComponent, 'onPress');
    });
    expect(forgotPassword).not.toHaveBeenCalled();
    cleanup();
  });

  test('should display an error message when the provided email is invalid', () => {
    const { queryByTestId, queryByPlaceholderText } = render(
      <ForgotPasswordScreen forgotPassword={forgotPassword} />,
    );
    const inputLogin = queryByPlaceholderText('Email Address');
    fireEvent(inputLogin, 'onChangeText', 'test@com');
    act(() => {
      fireEvent(queryByTestId('azzapp_Button_pressable-wrapper'), 'onPress');
    });
    expect(screen.queryByText('Please enter a valid email')).not.toBeNull();
    cleanup();
  });

  test('should display the confirmation message when a valid form is submitted', () => {
    jest.useFakeTimers();
    const { queryByPlaceholderText, queryByTestId } = render(
      <ForgotPasswordScreen forgotPassword={forgotPassword} />,
    );

    const inputLogin = queryByPlaceholderText('Email Address');
    fireEvent(inputLogin, 'onChangeText', 'test@test.com');
    act(() => {
      fireEvent(queryByTestId('azzapp_Button_pressable-wrapper'), 'onPress');
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
