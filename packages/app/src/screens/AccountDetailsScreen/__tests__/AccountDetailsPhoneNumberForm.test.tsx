import { RelayEnvironmentProvider } from 'react-relay';
import { createMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';
import { screen, render, fireEvent, act, waitFor } from '#helpers/testHelpers';
import AccountDetailsPhoneNumberForm from '../AccountDetailsPhoneNumberForm';
import type { RelayMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';

describe('AccountDetailsPhoneNumberForm', () => {
  let environment: RelayMockEnvironment;

  const renderAccountDetailsEmailForm = ({ phoneNumber = '+33612345678' }) => {
    environment = createMockEnvironment();

    return render(
      <RelayEnvironmentProvider environment={environment}>
        <AccountDetailsPhoneNumberForm
          currentUser={{
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

    const operation = environment.mock.getMostRecentOperation();

    expect(operation.request.node.operation.name).toBe(
      'useUpdateUser_Mutation',
    );

    expect(operation.request.variables.input).toEqual({
      phoneNumber: '+33 6 12 34 56 79',
    });
  });

  test('Should use device country - US in test context', async () => {
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

    const operation = environment.mock.getMostRecentOperation();

    expect(operation.request.node.operation.name).toBe(
      'useUpdateUser_Mutation',
    );

    expect(operation.request.variables.input).toEqual({
      phoneNumber: '+1 201 555 0123',
    });
  });
});
