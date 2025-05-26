import { Suspense } from 'react';
import { graphql, loadQuery, RelayEnvironmentProvider } from 'react-relay';
import { createOperationDescriptor, getRequest } from 'relay-runtime';
import { createMockEnvironment } from 'relay-test-utils';
import { onChangeWebCard } from '#helpers/authStore';
import { render } from '#helpers/testHelpers';
import { useProfileInfos } from '#hooks/authStateHooks';
import { useSetRevenueCatUserInfo } from '#hooks/useSetRevenueCatUserInfo';
import WelcomeScreenQueryNode from '#relayArtifacts/WelcomeScreenQuery.graphql';
import { WelcomeScreen } from '../WelcomeScreen';
import type { WelcomeScreenQuery } from '#relayArtifacts/WelcomeScreenQuery.graphql';
import type { RelayMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';

jest.mock('../HomeBottomSheetPanel', () => 'HomeBottomSheetPanel');

jest.mock('#helpers/authStore', () => ({
  onChangeWebCard: jest.fn(),
  getAuthState: jest.fn(),
}));

jest.mock('#hooks/authStateHooks', () => ({
  useProfileInfos: jest.fn(),
}));

jest.mock('#hooks/useSetRevenueCatUserInfo', () => ({
  useSetRevenueCatUserInfo: jest.fn(),
}));

const onChangeWebCardMock = onChangeWebCard as jest.MockedFunction<
  typeof onChangeWebCard
>;

const useProfileInfosMock = useProfileInfos as jest.MockedFunction<
  typeof useProfileInfos
>;

describe('WelcomeScreen', () => {
  const environment: RelayMockEnvironment = createMockEnvironment();

  const renderWelcomeScreen = (hasFocus = true) => {
    const preloadedQuery = loadQuery<WelcomeScreenQuery>(
      environment,
      WelcomeScreenQueryNode,
      {},
    );

    return render(
      <RelayEnvironmentProvider environment={environment}>
        <Suspense>
          <WelcomeScreen
            screenId="screenId"
            hasFocus={hasFocus}
            preloadedQuery={preloadedQuery}
            route={{
              route: 'ONBOARDING',
              params: undefined,
            }}
          />
        </Suspense>
      </RelayEnvironmentProvider>,
    );
  };

  beforeEach(() => {
    environment.mock.clearCache();
  });

  test("should call onChangeWebCard with null when current user don't have any profile", async () => {
    const testQuery = graphql`
      query WelcomeScreenTestPartialRenderQuery {
        currentUser {
          id
          profiles {
            id
          }
        }
      }
    `;

    environment.commitPayload(
      createOperationDescriptor(getRequest(testQuery), {}),
      {
        currentUser: {
          id: 'viewerId',
          profiles: [],
        },
      },
    );

    useProfileInfosMock.mockReturnValue(null);

    renderWelcomeScreen();

    expect(onChangeWebCardMock).toHaveBeenCalledWith(null);
    expect(useSetRevenueCatUserInfo).toHaveBeenCalled();
  });
});
