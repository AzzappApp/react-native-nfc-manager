import { RelayEnvironmentProvider } from 'react-relay';
import { createMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';
import { screen, render, fireEvent, act, waitFor } from '#helpers/testHelpers';
import AccountDetailsPasswordForm from '../AccountDetailsPasswordForm';
import type { RelayMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';

describe('AccountDetailsPasswordForm', () => {
  let environment: RelayMockEnvironment;

  const renderAccountDetailsEmailForm = () => {
    environment = createMockEnvironment();

    return render(
      <RelayEnvironmentProvider environment={environment}>
        <AccountDetailsPasswordForm toggleBottomSheet={() => void 0} visible />
      </RelayEnvironmentProvider>,
    );
  };

  test('Should submit updated password', async () => {
    renderAccountDetailsEmailForm();

    act(() => {
      fireEvent.changeText(
        screen.getByTestId('currentPasswordInput'),
        'currentPassword',
      );

      fireEvent.changeText(
        screen.getByTestId('newPasswordInput'),
        'NewPasswordTest_09',
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
      currentPassword: 'currentPassword',
      newPassword: 'NewPasswordTest_09',
    });
  });
});
