import { forgotPassword } from '#helpers/MobileWebAPI';
import { fireEvent, render, act, screen } from '#helpers/testHelpers';
import ForgotPasswordScreen from '../ForgotPasswordScreen';

jest.mock('#helpers/MobileWebAPI', () => ({
  forgotPassword: jest.fn(),
}));

describe('ForgotPassword Screen', () => {
  const forgotPasswordMock = jest.mocked(forgotPassword);
  beforeEach(() => {
    forgotPasswordMock.mockReset();
  });
  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test('should display the confirmation message when a valid form is submitted', () => {
    jest.useFakeTimers();
    const { getByPlaceholderText, getByRole } = render(
      <ForgotPasswordScreen />,
    );
    forgotPasswordMock.mockResolvedValueOnce({} as any);

    const inputLogin = getByPlaceholderText('Phone number or email address');
    act(() => {
      fireEvent(inputLogin, 'onChangeText', 'test@test.com');
    });
    act(() => {
      fireEvent(getByRole('button'), 'onPress');
    });

    jest.advanceTimersByTime(2000);

    expect(
      screen.queryByTestId(
        'azzapp__ForgotPasswordScreen__ViewTransition-confirm',
      ),
      //@ts-expect-error Property 'toHaveAnimatedStyle' does not exist on type 'JestMatchers<ReactTestInstance | null>
    ).toHaveAnimatedStyle({
      opacity: 1,
    });

    expect(
      screen.queryByTestId(
        'azzapp__ForgotPasswordScreen__ViewTransition-email',
      ),
      //@ts-expect-error Property 'toHaveAnimatedStyle' does not exist on type 'JestMatchers<ReactTestInstance | null>
    ).toHaveAnimatedStyle({
      opacity: 0,
    });
    jest.useRealTimers();
  });

  test('should render and show the enter email ', () => {
    const { getByTestId } = render(<ForgotPasswordScreen />);
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
      <ForgotPasswordScreen />,
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
  });

  test('should not call the `forgotPassword` callback when the provided email is invalid', () => {
    const { getByRole, getByPlaceholderText } = render(
      <ForgotPasswordScreen />,
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
  });

  test('Change password button should be `disabled` when the provided email is invalid', () => {
    const { queryByRole, getByPlaceholderText } = render(
      <ForgotPasswordScreen />,
    );
    const inputLogin = getByPlaceholderText('Phone number or email address');
    act(() => fireEvent(inputLogin, 'onChangeText', 'test@com'));
    const ubutton = queryByRole('button');
    expect(ubutton).toBeDisabled();
  });
});
