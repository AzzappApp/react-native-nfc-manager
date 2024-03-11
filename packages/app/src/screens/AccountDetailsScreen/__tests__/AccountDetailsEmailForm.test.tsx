import { requestUpdateContact } from '#helpers/MobileWebAPI';
import { screen, render, fireEvent, act, waitFor } from '#helpers/testHelpers';
import AccountDetailsEmailForm from '../AccountDetailsEmailForm';

jest.mock('#helpers/MobileWebAPI');

describe('AccountDetailsEmailForm', () => {
  const requestUpdateContactMock = jest.mocked(requestUpdateContact);

  beforeEach(() => {
    requestUpdateContactMock.mockReset();
  });

  const renderAccountDetailsEmailForm = () => {
    return render(
      <AccountDetailsEmailForm
        currentUser={{
          email: 'default@email.com',
          phoneNumber: '',
        }}
        toggleBottomSheet={() => void 0}
        visible
      />,
    );
  };

  test('Should render screen with all infos', () => {
    renderAccountDetailsEmailForm();

    expect(screen.getByDisplayValue('default@email.com')).toBeOnTheScreen();
  });

  test('Should request updated user change', async () => {
    requestUpdateContactMock.mockResolvedValueOnce({
      issuer: 'new@email.fr',
    });

    renderAccountDetailsEmailForm();

    act(() => {
      fireEvent.changeText(
        screen.getByDisplayValue('default@email.com'),
        'new@email.fr',
      );

      fireEvent.press(screen.getByText('Save'));
    });

    await waitFor(() => {
      expect(screen.getByText('Save')).toBeDefined();
    });

    expect(requestUpdateContactMock).toHaveBeenCalledWith({
      email: 'new@email.fr',
      locale: 'fr',
    });
  });
});
