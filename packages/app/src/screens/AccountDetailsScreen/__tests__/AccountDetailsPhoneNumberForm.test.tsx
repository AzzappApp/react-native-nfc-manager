import { RelayEnvironmentProvider } from 'react-relay';
import { createMockEnvironment } from 'relay-test-utils';
import { init as initLocaleHelpers } from '#helpers/localeHelpers';
import { requestUpdateContact } from '#helpers/MobileWebAPI';
import { screen, render, fireEvent, act, waitFor } from '#helpers/testHelpers';
import AccountDetailsPhoneNumberForm from '../AccountDetailsPhoneNumberForm';

jest.mock('#helpers/MobileWebAPI');

describe('AccountDetailsPhoneNumberForm', () => {
  const requestUpdateContactMock = jest.mocked(requestUpdateContact);

  beforeAll(() => {
    initLocaleHelpers();
  });

  beforeEach(() => {
    requestUpdateContactMock.mockReset();
  });

  const renderAccountDetailsEmailForm = ({ phoneNumber = '+33612345678' }) => {
    const environment = createMockEnvironment();

    return render(
      <RelayEnvironmentProvider environment={environment}>
        <AccountDetailsPhoneNumberForm
          currentUser={{
            id: 'testid',
            email: '',
            phoneNumber,
          }}
          toggleBottomSheet={() => void 0}
          visible
        />
      </RelayEnvironmentProvider>,
    );
  };

  test('Should render screen with all infos', () => {
    renderAccountDetailsEmailForm({});

    expect(screen.getByDisplayValue('06 12 34 56 78')).toBeOnTheScreen();
  });

  test('Should submit updated user', async () => {
    requestUpdateContactMock.mockResolvedValueOnce({
      issuer: '06 12 34 56 79',
    });

    renderAccountDetailsEmailForm({});

    act(() => {
      fireEvent.changeText(
        screen.getByDisplayValue('06 12 34 56 78'),
        '06 12 34 56 79',
      );

      fireEvent.press(screen.getByText('Save'));
    });

    await waitFor(() => {
      expect(screen.getByText('Save')).toBeDefined();
    });

    expect(requestUpdateContactMock).toHaveBeenCalledWith({
      phoneNumber: '+33 6 12 34 56 79',
      locale: 'fr',
    });
  });

  test('Should use device country - US in test context', async () => {
    requestUpdateContactMock.mockResolvedValueOnce({
      issuer: '+1 201 555 0123',
    });

    renderAccountDetailsEmailForm({ phoneNumber: '' });

    act(() => {
      fireEvent.changeText(
        screen.getByTestId('phoneNumberInput'),
        '2015550123',
      );

      fireEvent.press(screen.getByText('Save'));
    });

    await waitFor(() => {
      expect(screen.getByText('Save')).toBeDefined();
    });

    expect(requestUpdateContactMock).toHaveBeenCalledWith({
      phoneNumber: '+1 201 555 0123',
      locale: 'fr',
    });
  });
});
