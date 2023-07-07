import { range } from 'lodash';
import { Suspense } from 'react';
import * as ReactRelay from 'react-relay';
import { MockPayloadGenerator, createMockEnvironment } from 'relay-test-utils';
import NewProfileScreenQueryNode from '@azzapp/relay/artifacts/NewProfileScreenQuery.graphql';
import ERRORS from '@azzapp/shared/errors';
import { flushPromises } from '@azzapp/shared/jestHelpers';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { createProfile } from '#helpers/MobileWebAPI';
import { act, fireEvent, render, screen } from '#helpers/testHelpers';
import { NewProfileScreen } from '../NewProfileScreen';
import type { NewProfileScreenQuery } from '@azzapp/relay/artifacts/NewProfileScreenQuery.graphql';
import type { RelayMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
jest.mock('#ui/FadeSwitch', () => 'FadeSwitch');

jest.mock('#components/medias/NativeMediaImageRenderer');
jest.mock('#components/medias/NativeMediaVideoRenderer');
jest.mock('#helpers/MobileWebAPI');
jest.mock('#helpers/globalEvents');

const mockRouter = {
  back: jest.fn(),
  replaceAll: jest.fn(),
};
jest.mock('#components/NativeRouter', () => ({
  ...jest.requireActual('#components/NativeRouter'),
  useRouter() {
    return mockRouter;
  },
}));

jest.mock('react-relay', () => ({
  ...jest.requireActual('react-relay'),
  fetchQuery: jest.fn(),
}));

describe('NewProfileScreen', () => {
  let environment: RelayMockEnvironment;

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
        }),
      }),
    );
    environment.mock.queuePendingOperation(NewProfileScreenQueryNode, {});

    const preloadedQuery = ReactRelay.loadQuery<NewProfileScreenQuery>(
      environment,
      NewProfileScreenQueryNode,
      {},
    );
    const TestRenderer = () => {
      return (
        <Suspense>
          <NewProfileScreen
            screenId="NEW_PROFILE"
            hasFocus
            route={{
              route: 'NEW_PROFILE',
              params: { goBack: false },
            }}
            preloadedQuery={preloadedQuery}
          />
        </Suspense>
      );
    };

    return render(
      <ReactRelay.RelayEnvironmentProvider environment={environment}>
        <TestRenderer />
      </ReactRelay.RelayEnvironmentProvider>,
    );
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createProfileMock = jest.mocked(createProfile);
  const dispatchGlobalEventMock = jest.mocked(dispatchGlobalEvent);

  describe('ProfileKindStep', () => {
    test('should allows the user to choose which kind of profile', () => {
      renderNewProfileScreen();
      const profileKindButtons = screen.queryAllByRole('togglebutton');

      expect(profileKindButtons[0]).toHaveAccessibilityState(
        expect.objectContaining({ checked: true }),
      );

      expect(screen.getAllByTestId('category-image')[0]).toHaveProp(
        'source',
        'media-0-0',
      );

      act(() => {
        fireEvent.press(profileKindButtons[1]);
      });

      expect(profileKindButtons[0]).toHaveAccessibilityState(
        expect.objectContaining({ checked: false }),
      );

      expect(profileKindButtons[1]).toHaveAccessibilityState(
        expect.objectContaining({ checked: true }),
      );

      expect(screen.getAllByTestId('category-image')[0]).toHaveProp(
        'source',
        'media-1-0',
      );
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
        fireEvent.changeText(
          screen.getByPlaceholderText('Enter your last name'),
          'Doe',
        );
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

      await act(flushPromises);

      expect(createProfileMock).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          userName: 'johndoe',
          profileCategoryId: 'profileCategory-0',
          profileKind: 'personal',
        }),
      );

      expect(dispatchGlobalEventMock).toHaveBeenCalledWith({
        type: 'PROFILE_CHANGE',
        payload: {
          authTokens: {
            token: 'fakeToken',
            refreshToken: 'fakeRefreshToken',
          },
          profileId: 'profile-0',
        },
      });
      await act(flushPromises);
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
      );
    });

    test('should display an error message if the username is invalid', async () => {
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
        fireEvent.press(screen.getByTestId('submit-button'));
      });

      await act(flushPromises);

      expect(
        screen.queryByText(
          'Username can’t contain space or special characters',
        ),
      ).not.toBeTruthy();

      act(() => {
        fireEvent.changeText(
          screen.getByPlaceholderText('Choose an username'),
          'ddssd$$$',
        );
      });

      act(() => {
        fireEvent.press(screen.getByTestId('submit-button'));
      });

      await act(flushPromises);

      expect(
        screen.queryByText(
          'Username can’t contain space or special characters',
        ),
      ).toBeTruthy();

      expect(createProfileMock).not.toHaveBeenCalled();
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

      act(() => {
        fireEvent.press(screen.getByTestId('submit-button'));
      });

      createProfileMock.mockRejectedValueOnce(
        new Error(ERRORS.USERNAME_ALREADY_EXISTS),
      );

      expect(
        screen.queryByText('This username is already used by someone else'),
      ).not.toBeTruthy();
      await act(flushPromises);

      expect(createProfileMock).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          userName: 'johndoe',
          profileCategoryId: 'profileCategory-0',
          profileKind: 'personal',
        }),
      );

      expect(
        screen.queryByText('This username is already used by someone else'),
      ).toBeTruthy();
    });
  });
});
