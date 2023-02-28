import { RelayEnvironmentProvider } from 'react-relay';
import { createMockEnvironment, MockPayloadGenerator } from 'relay-test-utils';
import { act, fireEvent, render, waitFor } from '#utils/test-util';
import '@testing-library/jest-native/extend-expect';
import SignUpScreen from '../SignUpScreen';

const environement = createMockEnvironment();
environement.mock.queueOperationResolver(operation =>
  MockPayloadGenerator.generate(operation, {
    User: (_, generateId) => {
      if (operation.fragment.variables.userName !== 'sebastien') {
        return { id: String(generateId()) };
      }
      return {
        id: String(generateId()),
        userName: 'sebastien',
      };
    },
  }),
);

describe('Signup Screen', () => {
  const signup = jest.fn();
  beforeEach(() => {
    signup.mockReset();
  });
  test('should call the `signup` callback if form is valid', async () => {
    const { queryAllByRole, queryAllByTestId, queryByPlaceholderText } = render(
      <RelayEnvironmentProvider environment={environement}>
        <SignUpScreen signup={signup} />
      </RelayEnvironmentProvider>,
    );
    const inputLogin = queryByPlaceholderText('Phone Number of email address');
    fireEvent(inputLogin, 'onChangeText', 'test@azzaap.com');

    const input = queryByPlaceholderText('Password');
    fireEvent(input, 'onChangeText', 'AZEqsd81');

    const inputUsername = queryByPlaceholderText('Choose a username');

    fireEvent(inputUsername, 'onChangeText', 'sebastienValid');

    const checkboxes = queryAllByTestId('azzapp__CheckBox__view-wrapper');
    fireEvent(checkboxes[0], 'onPress');
    fireEvent(checkboxes[1], 'onPress');

    const buttonComponent = queryAllByRole('button')[1];
    act(() => fireEvent(buttonComponent, 'onPress'));
    await waitFor(() => expect(signup).toHaveBeenCalled());
  });

  test('should not call the `signup` callback if email is not valid', () => {
    const { queryAllByRole, queryAllByTestId, queryByPlaceholderText } = render(
      <RelayEnvironmentProvider environment={environement}>
        <SignUpScreen signup={signup} />
      </RelayEnvironmentProvider>,
    );
    const inputLogin = queryByPlaceholderText('Phone Number of email address');
    fireEvent(inputLogin, 'onChangeText', 'test@com');

    const input = queryByPlaceholderText('Password');
    fireEvent(input, 'onChangeText', 'AZEqsd81');

    const checkboxes = queryAllByTestId('azzapp__CheckBox__view-wrapper');
    fireEvent(checkboxes[0], 'onPress');
    fireEvent(checkboxes[1], 'onPress');
    const buttonComponent = queryAllByRole('button')[1];
    fireEvent(buttonComponent, 'onPress');
    expect(signup).not.toHaveBeenCalled();
  });

  test('should not call the `signup` callback if password is not valid', () => {
    const { queryAllByRole, queryAllByTestId, queryByPlaceholderText } = render(
      <RelayEnvironmentProvider environment={environement}>
        <SignUpScreen signup={signup} />
      </RelayEnvironmentProvider>,
    );
    const inputLogin = queryByPlaceholderText('Phone Number of email address');
    fireEvent(inputLogin, 'onChangeText', 'test@azzaap.com');

    const input = queryByPlaceholderText('Password');
    fireEvent(input, 'onChangeText', 'wonrpsdfsdfass');

    const checkboxes = queryAllByTestId('azzapp__CheckBox__view-wrapper');

    fireEvent(checkboxes[0], 'onPress');
    fireEvent(checkboxes[1], 'onPress');
    const buttonComponent = queryAllByRole('button')[1];

    fireEvent(buttonComponent, 'onPress');
    expect(signup).not.toHaveBeenCalled();
  });

  test('should not call the `signup` callback if username is not valid', () => {
    const { queryAllByRole, queryAllByTestId, queryByPlaceholderText } = render(
      <RelayEnvironmentProvider environment={environement}>
        <SignUpScreen signup={signup} />
      </RelayEnvironmentProvider>,
    );
    const inputLogin = queryByPlaceholderText('Phone Number of email address');
    fireEvent(inputLogin, 'onChangeText', 'test@azzaap.com');

    const input = queryByPlaceholderText('Password');
    fireEvent(input, 'onChangeText', 'AZEqsd81');

    const inputUsername = queryByPlaceholderText('Choose a username');
    fireEvent(inputUsername, 'onChangeText', '123');

    const checkboxes = queryAllByTestId('azzapp__CheckBox__view-wrapper');

    fireEvent(checkboxes[0], 'onPress');
    fireEvent(checkboxes[1], 'onPress');
    const buttonComponent = queryAllByRole('button')[1];

    fireEvent(buttonComponent, 'onPress');
    expect(signup).not.toHaveBeenCalled();
  });

  test('should not call the `signup` callback if username is not valid', () => {
    const { queryAllByRole, queryAllByTestId, queryByPlaceholderText } = render(
      <RelayEnvironmentProvider environment={environement}>
        <SignUpScreen signup={signup} />
      </RelayEnvironmentProvider>,
    );
    const inputLogin = queryByPlaceholderText('Phone Number of email address');
    fireEvent(inputLogin, 'onChangeText', 'test@azzaap.com');

    const input = queryByPlaceholderText('Password');
    fireEvent(input, 'onChangeText', 'AZEqsd81');

    const inputUsername = queryByPlaceholderText('Choose a username');
    fireEvent(inputUsername, 'onChangeText', '123');

    const checkboxes = queryAllByTestId('azzapp__CheckBox__view-wrapper');

    fireEvent(checkboxes[0], 'onPress');
    fireEvent(checkboxes[1], 'onPress');
    const buttonComponent = queryAllByRole('button')[1];

    fireEvent(buttonComponent, 'onPress');
    expect(signup).not.toHaveBeenCalled();
  });

  test('should not call the `signup` callback and show error message if username already exists', () => {
    const { queryAllByRole, queryAllByTestId, queryByPlaceholderText } = render(
      <RelayEnvironmentProvider environment={environement}>
        <SignUpScreen signup={signup} />
      </RelayEnvironmentProvider>,
    );
    const inputLogin = queryByPlaceholderText('Phone Number of email address');
    fireEvent(inputLogin, 'onChangeText', 'test@azzaap.com');

    const input = queryByPlaceholderText('Password');
    fireEvent(input, 'onChangeText', 'AZEqsd81');

    const inputUsername = queryByPlaceholderText('Choose a username');
    fireEvent(inputUsername, 'onChangeText', 'sebastien');
    act(() => fireEvent(inputUsername, 'onBlur'));

    const checkboxes = queryAllByTestId('azzapp__CheckBox__view-wrapper');

    fireEvent(checkboxes[0], 'onPress');
    fireEvent(checkboxes[1], 'onPress');
    const buttonComponent = queryAllByRole('button')[1];

    fireEvent(buttonComponent, 'onPress');
    expect(signup).not.toHaveBeenCalled();
  });

  test('Sign Up button should be disabled if phone number is not valid', () => {
    const { queryAllByRole, queryAllByTestId, queryByPlaceholderText } = render(
      <RelayEnvironmentProvider environment={environement}>
        <SignUpScreen signup={signup} />
      </RelayEnvironmentProvider>,
    );
    const inputLogin = queryByPlaceholderText('Phone Number of email address');
    fireEvent(inputLogin, 'onChangeText', '+3368876');

    const input = queryByPlaceholderText('Password');
    fireEvent(input, 'onChangeText', 'wonrpsdfsdfass');

    const checkboxes = queryAllByTestId('azzapp__CheckBox__view-wrapper');

    fireEvent(checkboxes[0], 'onPress');
    fireEvent(checkboxes[1], 'onPress');
    const buttonComponent = queryAllByRole('button')[1];
    expect(buttonComponent).toBeDisabled();
  });

  test('should not call the `signup` callback if the terms of service checkbox is not checked', () => {
    const { queryAllByRole, queryAllByTestId, queryByPlaceholderText } = render(
      <RelayEnvironmentProvider environment={environement}>
        <SignUpScreen signup={signup} />
      </RelayEnvironmentProvider>,
    );
    const inputLogin = queryByPlaceholderText('Phone Number of email address');
    fireEvent(inputLogin, 'onChangeText', 'test@azzaap.com');

    const input = queryByPlaceholderText('Password');
    fireEvent(input, 'onChangeText', 'AZEqsd81');

    const checkboxes = queryAllByTestId('azzapp__CheckBox__view-wrapper');
    fireEvent(checkboxes[1], 'onPress');
    const buttonComponent = queryAllByRole('button')[1];
    fireEvent(buttonComponent, 'onPress');
    expect(signup).not.toHaveBeenCalled();
  });

  test('should not call the `signup` callback if privacy policy checkbox is not checked', () => {
    const { queryAllByRole, queryAllByTestId, queryByPlaceholderText } = render(
      <RelayEnvironmentProvider environment={environement}>
        <SignUpScreen signup={signup} />
      </RelayEnvironmentProvider>,
    );
    const inputLogin = queryByPlaceholderText('Phone Number of email address');
    fireEvent(inputLogin, 'onChangeText', 'test@azzaap.com');

    const input = queryByPlaceholderText('Password');
    fireEvent(input, 'onChangeText', 'AZEqsd81');

    const checkboxes = queryAllByTestId('azzapp__CheckBox__view-wrapper');

    fireEvent(checkboxes[0], 'onPress');
    const buttonComponent = queryAllByRole('button')[1];
    fireEvent(buttonComponent, 'onPress');
    expect(signup).not.toHaveBeenCalled();
  });

  test('Sign Up Button should be disabled if Phone Number or Email address has not been filled', () => {
    const { queryAllByRole, queryAllByTestId, queryByPlaceholderText } = render(
      <RelayEnvironmentProvider environment={environement}>
        <SignUpScreen signup={signup} />
      </RelayEnvironmentProvider>,
    );

    const input = queryByPlaceholderText('Password');
    fireEvent(input, 'onChangeText', 'AZEqsd81');

    const checkboxes = queryAllByTestId('azzapp__CheckBox__view-wrapper');

    fireEvent(checkboxes[0], 'onPress');
    fireEvent(checkboxes[1], 'onPress');
    const buttonComponent = queryAllByRole('button')[1];
    expect(buttonComponent).toBeDisabled();
  });

  test('should display an error message and not call the `signup`callback if password is not filled when pressing `Sign Up`button', () => {
    const { queryAllByRole, queryAllByTestId, queryByPlaceholderText } = render(
      <RelayEnvironmentProvider environment={environement}>
        <SignUpScreen signup={signup} />
      </RelayEnvironmentProvider>,
    );

    const input = queryByPlaceholderText('Phone Number of email address');
    fireEvent(input, 'onChangeText', 'test@azzaap.coms');

    const checkboxes = queryAllByTestId('azzapp__CheckBox__view-wrapper');

    fireEvent(checkboxes[0], 'onPress');
    fireEvent(checkboxes[1], 'onPress');
    const buttonComponent = queryAllByRole('button')[1];
    fireEvent(buttonComponent, 'onPress');
    expect(signup).not.toHaveBeenCalled();
  });
});
