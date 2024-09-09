import { forgotPassword } from '#helpers/MobileWebAPI';
import { fireEvent, render, act, waitFor } from '#helpers/testHelpers';
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

  test.only('should display the confirmation message when a valid form is submitted', async () => {
    jest.useFakeTimers();
    const { getByPlaceholderText, getByLabelText } = render(
      <ForgotPasswordScreen />,
    );
    forgotPasswordMock.mockResolvedValueOnce({} as any);

    const inputLogin = getByPlaceholderText('Email address');
    act(() => {
      fireEvent(inputLogin, 'onChangeText', 'test@test.com');
    });
    act(() => {
      fireEvent.press(getByLabelText('Tap to reset your password'));
    });

    await waitFor(() => expect(forgotPasswordMock).toBeCalled());

    jest.useRealTimers();
  });

  test('should not call the `forgotPassword` callback when the provided email is invalid', () => {
    const { getByRole, getByPlaceholderText } = render(
      <ForgotPasswordScreen />,
    );
    const inputLogin = getByPlaceholderText('Email address');
    act(() => {
      fireEvent(inputLogin, 'onChangeText', 'test@com');
    });

    const buttonComponent = getByRole('button');
    act(() => {
      fireEvent(buttonComponent, 'onPress');
    });
    expect(forgotPassword).not.toHaveBeenCalled();
  });
});
