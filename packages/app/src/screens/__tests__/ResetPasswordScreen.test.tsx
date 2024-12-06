import { flushPromises } from '@azzapp/shared/jestHelpers';
import { changePassword } from '#helpers/MobileWebAPI';
import {
  fireEvent,
  render,
  cleanup,
  screen,
  waitFor,
} from '#helpers/testHelpers';
import ResetPasswordScreen from '../ResetPasswordScreen';

jest.mock('#helpers/MobileWebAPI');

describe('ChangePasswordScreen Screen', () => {
  const changePasswordMock = jest.mocked(changePassword);
  beforeEach(() => {
    changePasswordMock.mockReset();
  });

  const renderAccountDetailsEmailForm = () => {
    return render(
      <ResetPasswordScreen
        screenId="id"
        hasFocus
        route={{
          route: 'RESET_PASSWORD',
          params: {
            token: 'token',
            issuer: 'issuer',
          },
        }}
      />,
    );
  };

  test('should not call the `changePassword` callback and show error message when password does not match the requirement', async () => {
    renderAccountDetailsEmailForm();
    const inputPwd = screen.getByPlaceholderText('New password');
    const inputConfirm = screen.getByPlaceholderText('Confirm password');

    fireEvent.changeText(inputPwd, 'insufficient password');
    fireEvent(inputPwd, 'onBlur');
    fireEvent.changeText(inputConfirm, 'insufficient password');
    fireEvent(inputConfirm, 'onBlur');

    flushPromises();

    await waitFor(() => {
      expect(
        screen.getByText(
          'Password should contain at least 8 characters and at most 32 characters, a number, an uppercase letter and a lowercase letter',
        ),
      ).toBeTruthy();
    });

    expect(changePasswordMock).not.toHaveBeenCalled();

    cleanup();
  });

  test('should not call the `changePassword` callback and shows error message when password does not match the confirm password', async () => {
    renderAccountDetailsEmailForm();
    const inputPwd = screen.getByPlaceholderText('New password');
    const inputConfirm = screen.getByPlaceholderText('Confirm password');

    fireEvent.changeText(inputPwd, 'AZErty123&');
    fireEvent(inputPwd, 'onBlur');
    fireEvent.changeText(inputConfirm, 'doest not match');
    fireEvent(inputConfirm, 'onBlur');

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeTruthy();
    });
    expect(changePasswordMock).not.toHaveBeenCalled();

    cleanup();
  });

  test('should call the `changePassword` callback when form is valid', async () => {
    renderAccountDetailsEmailForm();
    const inputPwd = screen.getByPlaceholderText('New password');
    const inputConfirm = screen.getByPlaceholderText('Confirm password');
    const buttonComponent = screen.getByTestId('submitButton');

    fireEvent.changeText(inputPwd, 'AZErty123&');
    fireEvent(inputPwd, 'onBlur');
    fireEvent.changeText(inputConfirm, 'AZErty123&');
    fireEvent(inputConfirm, 'onBlur');

    await waitFor(() => {
      expect(buttonComponent).toBeEnabled();
    });

    fireEvent.press(buttonComponent);

    await waitFor(() => {
      expect(changePasswordMock).toHaveBeenCalled();
    });

    cleanup();
  });
});
