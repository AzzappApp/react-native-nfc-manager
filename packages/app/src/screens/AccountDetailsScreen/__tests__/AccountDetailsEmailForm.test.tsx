import { RelayEnvironmentProvider } from 'react-relay';
import { createMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';
import { screen, render, fireEvent, act, waitFor } from '#helpers/testHelpers';
import AccountDetailsEmailForm from '../AccountDetailsEmailForm';
import type { RelayMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';

describe('AccountDetailsEmailForm', () => {
  let environment: RelayMockEnvironment;

  const renderAccountDetailsEmailForm = () => {
    environment = createMockEnvironment();

    return render(
      <RelayEnvironmentProvider environment={environment}>
        <AccountDetailsEmailForm
          currentUser={{
            email: 'default@email.com',
            phoneNumber: '',
          }}
          toggleBottomSheet={() => void 0}
          visible
        />
      </RelayEnvironmentProvider>,
    );
  };

  test('Should render screen with all infos', () => {
    renderAccountDetailsEmailForm();

    expect(screen.getByDisplayValue('default@email.com')).toBeOnTheScreen();
  });

  test('Should submit updated user', async () => {
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

    const operation = environment.mock.getMostRecentOperation();

    expect(operation.request.node.operation.name).toBe(
      'useUpdateUser_Mutation',
    );

    expect(operation.request.variables.input).toEqual({
      email: 'new@email.fr',
    });
  });
});
