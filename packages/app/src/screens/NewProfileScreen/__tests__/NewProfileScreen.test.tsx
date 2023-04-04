import { range } from 'lodash';
import {
  RelayEnvironmentProvider,
  graphql,
  useLazyLoadQuery,
} from 'react-relay';
import { MockPayloadGenerator, createMockEnvironment } from 'relay-test-utils';
import ERRORS from '@azzapp/shared/errors';
import { flushPromises } from '@azzapp/shared/jestHelpers';
import { createProfile } from '@azzapp/shared/WebAPI';
import { act, fireEvent, render, screen } from '#helpers/testHelpers';
import NewProfileScreen from '..';
import type { NewProfileScreenTestQuery } from '@azzapp/relay/artifacts/NewProfileScreenTestQuery.graphql';
import type { RelayMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';
import '@testing-library/jest-native/extend-expect';

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

jest.mock('@azzapp/shared/WebAPI', () => ({
  createProfile: jest.fn(),
}));
jest.mock('#ui/FadeSwitch', () => 'FadeSwitch');

describe('NewProfileScreen', () => {
  let environment: RelayMockEnvironment;

  const onClose = jest.fn();
  const onProfileCreated = jest.fn();

  const renderNewProfileScreen = () => {
    environment = createMockEnvironment();
    environment.mock.queueOperationResolver(operation =>
      MockPayloadGenerator.generate(operation, {
        Query: () => ({
          profileCategories: range(0, 10).map(i => ({
            id: `profileCategory-${i}`,
            profileKind: i % 2 === 0 ? 'personal' : 'business',
            label: `Profile Category ${i}`,
            medias: range(0, 10).map(j => ({
              id: `media-${i}-${j}`,
              uri: `https://fakeMedia.com/${i}-${j}.jpg`,
            })),
            companyActivities:
              i % 2 === 0
                ? []
                : range(0, 10).map(j => ({
                    id: `companyActivity-${i}-${j}`,
                    label: `Company Activity ${i}-${j}`,
                  })),
          })),
          interests: range(0, 15).map(i => ({
            tag: `interest-${i}`,
            label: `Interest ${i}`,
          })),
        }),
      }),
    );

    const TestRenderer = () => {
      const data = useLazyLoadQuery<NewProfileScreenTestQuery>(
        graphql`
          query NewProfileScreenTestQuery @relay_test_operation {
            ...NewProfileScreen_query
          }
        `,
        {},
      );
      return (
        <NewProfileScreen
          data={data}
          onClose={onClose}
          onProfileCreated={onProfileCreated}
        />
      );
    };

    return render(
      <RelayEnvironmentProvider environment={environment}>
        <TestRenderer />
      </RelayEnvironmentProvider>,
    );
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createProfileMock = createProfile as jest.MockedFunction<
    typeof createProfile
  >;

  describe('ProfileKindStep', () => {
    test('should allows the user to choose which kind of profile', () => {
      renderNewProfileScreen();
      const profileKindButtons = screen.queryAllByRole('togglebutton');

      expect(profileKindButtons[0]).toHaveAccessibilityState(
        expect.objectContaining({ checked: true }),
      );

      expect(screen.getAllByTestId('category-image')[0]).toHaveProp('source', {
        uri: 'https://fakeMedia.com/0-0.jpg',
      });

      act(() => {
        fireEvent.press(profileKindButtons[1]);
      });

      expect(profileKindButtons[0]).toHaveAccessibilityState(
        expect.objectContaining({ checked: false }),
      );

      expect(profileKindButtons[1]).toHaveAccessibilityState(
        expect.objectContaining({ checked: true }),
      );

      expect(screen.getAllByTestId('category-image')[0]).toHaveProp('source', {
        uri: 'https://fakeMedia.com/1-0.jpg',
      });
    });

    test('should display the personal profile form when user choose a personal profile', () => {
      renderNewProfileScreen();

      act(() => {
        fireEvent.press(screen.getByRole('button'));
      });

      expect(
        screen.queryByPlaceholderText('Enter your first name'),
      ).toBeTruthy();
    });

    test('should display the business profile form when user choose a business profile', () => {
      renderNewProfileScreen();

      act(() => {
        fireEvent.press(screen.getAllByRole('togglebutton')[1]);
      });

      act(() => {
        fireEvent.press(screen.getByRole('button'));
      });

      expect(screen.queryByPlaceholderText('Enter your name')).toBeTruthy();
    });
  });

  const renderToProfileForm = (profileKind: 'business' | 'personal') => {
    renderNewProfileScreen();
    if (profileKind === 'business') {
      act(() => {
        fireEvent.press(screen.queryAllByRole('togglebutton')[1]);
      });
    }

    act(() => {
      fireEvent.press(screen.getByRole('button'));
    });
  };

  describe('Profile Form', () => {
    test('should allows the user to fill the form', async () => {
      renderToProfileForm('personal');

      act(() => {
        fireEvent.changeText(
          screen.getByPlaceholderText('Enter your first name'),
          'John',
        );
      });

      act(() => {
        fireEvent.changeText(
          screen.getByPlaceholderText('Enter your last name'),
          'Doe',
        );
      });

      act(() => {
        fireEvent.changeText(
          screen.getByPlaceholderText('Choose an username'),
          'johndoe',
        );
      });

      createProfileMock.mockResolvedValueOnce({
        profileId: 'profile-0',
        token: 'fakeToken',
        refreshToken: 'fakeRefreshToken',
      });

      act(() => {
        fireEvent.press(screen.getByTestId('submit-button'));
      });

      expect(createProfileMock).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          userName: 'johndoe',
          profileCategoryId: 'profileCategory-0',
          profileKind: 'personal',
        }),
        expect.anything(),
      );

      await act(flushPromises);
      expect(onProfileCreated).toHaveBeenCalledWith({
        profileId: 'profile-0',
        token: 'fakeToken',
        refreshToken: 'fakeRefreshToken',
      });
    });

    test('should allows the user to fill the form for business', async () => {
      renderToProfileForm('business');

      act(() => {
        fireEvent.changeText(
          screen.getByPlaceholderText('Enter your name'),
          'Azzapp',
        );
      });

      act(() => {
        fireEvent.press(screen.getByRole('combobox'));
      });

      let activityButton = screen.getByText('Company Activity 1-4');
      while (activityButton && !activityButton.props.onPress) {
        activityButton = activityButton.parent!;
      }
      act(() => {
        fireEvent.press(activityButton);
      });

      act(() => {
        fireEvent.changeText(
          screen.getByPlaceholderText('Choose an username'),
          'Azzapp',
        );
      });

      act(() => {
        fireEvent.press(screen.getByTestId('submit-button'));
      });
      await act(flushPromises);

      expect(createProfileMock).toHaveBeenCalledWith(
        expect.objectContaining({
          companyName: 'Azzapp',
          userName: 'azzapp',
          profileCategoryId: 'profileCategory-1',
          companyActivityId: 'companyActivity-1-4',
          profileKind: 'business',
        }),
        expect.anything(),
      );
    });

    test('should display an error message if the username is invalid', () => {
      renderToProfileForm('personal');

      act(() => {
        fireEvent.changeText(
          screen.getByPlaceholderText('Enter your first name'),
          'John',
        );
      });

      act(() => {
        fireEvent.changeText(
          screen.getByPlaceholderText('Enter your last name'),
          'Doe',
        );
      });

      expect(
        screen.queryByText('Username can’t contain space or special caracters'),
      ).not.toBeTruthy();
      act(() => {
        fireEvent.changeText(
          screen.getByPlaceholderText('Choose an username'),
          'ddssd$$$',
        );
      });
      expect(
        screen.queryByText('Username can’t contain space or special caracters'),
      ).toBeTruthy();

      act(() => {
        fireEvent.press(screen.getByTestId('submit-button'));
      });

      expect(createProfileMock).not.toHaveBeenCalled();
      expect(onProfileCreated);
    });

    test('should display an error message when the user name is already taken', async () => {
      // TODO test validation as you type
      renderToProfileForm('personal');

      act(() => {
        fireEvent.changeText(
          screen.getByPlaceholderText('Enter your first name'),
          'John',
        );
      });

      act(() => {
        fireEvent.changeText(
          screen.getByPlaceholderText('Enter your last name'),
          'Doe',
        );
      });

      act(() => {
        fireEvent.changeText(
          screen.getByPlaceholderText('Choose an username'),
          'johndoe',
        );
      });

      createProfileMock.mockRejectedValueOnce(
        new Error(ERRORS.USERNAME_ALREADY_EXISTS),
      );

      act(() => {
        fireEvent.press(screen.getByTestId('submit-button'));
      });

      expect(createProfileMock).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          userName: 'johndoe',
          profileCategoryId: 'profileCategory-0',
          profileKind: 'personal',
        }),
        expect.anything(),
      );

      expect(
        screen.queryByText('This username is already used by someone else'),
      ).not.toBeTruthy();
      await act(flushPromises);
      expect(
        screen.queryByText('This username is already used by someone else'),
      ).toBeTruthy();
    });
  });

  const renderToInterestPicker = async () => {
    renderToProfileForm('business');
    createProfileMock.mockResolvedValue({
      profileId: 'profile-1',
      token: 'fakeToken',
      refreshToken: 'fakeRefreshToken',
    });
    act(() => {
      fireEvent.changeText(
        screen.getByPlaceholderText('Choose an username'),
        'johndoe',
      );
    });

    act(() => {
      fireEvent.press(screen.getByTestId('submit-button'));
    });
    await act(flushPromises);
  };

  describe('InterestPicker', () => {
    test('should display the list of interests', async () => {
      await renderToInterestPicker();
      expect(screen.getAllByRole('togglebutton')).toHaveLength(15);
    });

    test('should allows the user to select an interest', async () => {
      await renderToInterestPicker();

      const interestButtons = screen.getAllByRole('togglebutton');
      act(() => {
        fireEvent.press(interestButtons[2]);
        fireEvent.press(interestButtons[6]);
      });

      act(() => {
        fireEvent.press(screen.getByTestId('get-started-button'));
      });

      const operation = environment.mock.getMostRecentOperation();

      expect(operation.request.node.operation.name).toBe(
        'InterestPickerMutation',
      );

      expect(operation.request.variables.input).toEqual({
        // Order differ because of the way the list is rendered
        interests: ['interest-14', 'interest-12'],
      });
      act(() => {
        environment.mock.resolve(
          operation,
          MockPayloadGenerator.generate(operation),
        );
      });
      await act(flushPromises);

      expect(onClose).toHaveBeenCalled();
    });

    test('should allows the user to skip an interest', async () => {
      await renderToInterestPicker();
      act(() => {
        fireEvent.press(screen.getByTestId('skip-button'));
      });
      expect(onClose).toHaveBeenCalled();
    });
  });
});
