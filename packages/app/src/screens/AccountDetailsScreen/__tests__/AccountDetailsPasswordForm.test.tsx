import {
  graphql,
  RelayEnvironmentProvider,
  useLazyLoadQuery,
} from 'react-relay';
import { MockPayloadGenerator } from 'relay-test-utils';
import { createMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';
import { screen, render, fireEvent, act, waitFor } from '#helpers/testHelpers';
import AccountDetailsPasswordForm from '../AccountDetailsPasswordForm';
import type { AccountDetailsPasswordFormQuery } from '#relayArtifacts/AccountDetailsPasswordFormQuery.graphql';
import type { RelayMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';

describe('AccountDetailsPasswordForm', () => {
  let environment: RelayMockEnvironment;

  const TestRenderer = () => {
    const data = useLazyLoadQuery<AccountDetailsPasswordFormQuery>(
      graphql`
        query AccountDetailsPasswordFormQuery @relay_test_operation {
          currentUser {
            id
            ...AccountDetailsPasswordForm_currentUser
          }
        }
      `,
      {},
    );

    return (
      <AccountDetailsPasswordForm
        toggleBottomSheet={() => void 0}
        visible
        user={data.currentUser!}
      />
    );
  };

  const renderAccountDetailsEmailForm = () => {
    environment = createMockEnvironment();
    environment.mock.queueOperationResolver(operation =>
      MockPayloadGenerator.generate(operation, {
        User() {
          return {
            id: 'user-id-123',
            hasPassword: true,
          };
        },
      }),
    );

    return render(
      <RelayEnvironmentProvider environment={environment}>
        <TestRenderer />
      </RelayEnvironmentProvider>,
    );
  };

  test('Should submit updated password', async () => {
    renderAccountDetailsEmailForm();

    await act(async () => {
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

  test('Should submit new password only when user has no password', async () => {
    environment = createMockEnvironment();

    environment.mock.queueOperationResolver(operation =>
      MockPayloadGenerator.generate(operation, {
        User() {
          return {
            id: 'user-id-456',
            hasPassword: false,
          };
        },
      }),
    );

    render(
      <RelayEnvironmentProvider environment={environment}>
        <TestRenderer />
      </RelayEnvironmentProvider>,
    );

    // Make sure currentPasswordInput is not rendered
    expect(screen.queryByTestId('currentPasswordInput')).toBeNull();

    // Fill in new password and submit
    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('newPasswordInput'),
        'NewPasswordTest_09',
      );
      fireEvent.press(screen.getByText('Save'));
    });

    const operation = environment.mock.getMostRecentOperation();

    expect(operation.request.node.operation.name).toBe(
      'useUpdateUser_Mutation',
    );
    expect(operation.request.variables.input).toEqual({
      currentPassword: '',
      newPassword: 'NewPasswordTest_09',
    });
  });
});
