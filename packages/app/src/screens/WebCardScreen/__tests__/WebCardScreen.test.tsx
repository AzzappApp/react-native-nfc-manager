import { act, Suspense } from 'react';
import { graphql, loadQuery, RelayEnvironmentProvider } from 'react-relay';
import { createOperationDescriptor, getRequest } from 'relay-runtime';
import { createMockEnvironment } from 'relay-test-utils';
import { render } from '#helpers/testHelpers';
import WebCardScreenByIdQueryNode from '#relayArtifacts/WebCardScreenByIdQuery.graphql';
import { WebCardScreen } from '../WebCardScreen';
import type { WebCardScreenByIdQuery } from '#relayArtifacts/WebCardScreenByIdQuery.graphql';
import type { RelayMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';

jest.mock('react-native-share', () => ({}));

describe('WebCardScreen', () => {
  const environment: RelayMockEnvironment = createMockEnvironment();

  const renderWebCarScreen = (
    webCardId = 'webCardId',
    viewerWebCardId = 'viewerWebCardId',
    profileId = 'testProfileId',
  ) => {
    const preloadedQuery = loadQuery<WebCardScreenByIdQuery>(
      environment,
      WebCardScreenByIdQueryNode,
      { webCardId, viewerWebCardId, profileId },
    );

    return render(
      <RelayEnvironmentProvider environment={environment}>
        <Suspense>
          <WebCardScreen
            screenId="screenId"
            hasFocus
            route={{
              route: 'WEBCARD',
              params: { webCardId },
            }}
            preloadedQuery={preloadedQuery}
          />
        </Suspense>
      </RelayEnvironmentProvider>,
    );
  };

  beforeEach(() => {
    environment.mock.clearCache();
  });

  test('should render cover while loading if data are in cache', () => {
    jest.useFakeTimers();
    const testQuery = graphql`
      query WebCardScreenTestPartialRenderQuery {
        node(id: "webCardId-1") {
          ... on WebCard {
            id
            userName
            cardIsPublished
            cardColors {
              otherColors
            }
            ...CoverRenderer_webCard
          }
        }
        webcard: node(id: "viewerWebCardId") {
          id
        }
        ## TODO the fact that we need to fetch the profile is a miss conception and should be fixed
        profile: node(id: "testProfileId") {
          id
          ... on Profile {
            webCard {
              id
            }
          }
        }
        currentUser {
          id
        }
      }
    `;
    environment.commitPayload(
      createOperationDescriptor(getRequest(testQuery), {}),
      {
        node: {
          __typename: 'WebCard',
          id: 'webCardId-1',
          userName: 'jdoe',
          cardColors: {
            primary: '#FF0000',
            dark: '#000000',
            light: '#FFFFFF',
            otherColors: ['#000000', '#FFFFFF'],
          },
          coverIsPredefined: false,
          firstName: 'John',
          lastName: 'Doe',
          companyName: null,
          companyActivityLabel: null,
          webCardKind: 'PERSONAL',
          coverBackgroundColor: '#FF0000',
          cardIsPublished: true,
          coverMedia: {
            id: 'mediaId',
            __typename: 'MediaImage',
            smallURI: 'https://azzapp.com/fakeSmallURI.jpg',
            uri: 'https://azzapp.com/fakeURI.jpg',
          },
          coverDynamicLinks: null,
        },
        currentUser: {
          id: 'viewerId',
        },
        webcard: {
          id: 'viewerWebCardId',
          __typename: 'WebCard',
        },
        profile: {
          id: 'testProfileId',
          __typename: 'Profile',
          webCard: {
            id: 'viewerWebCardId',
          },
        },
      },
    );

    const { getByTestId } = renderWebCarScreen('webCardId-1');
    act(() => {
      jest.runAllTimers();
    });
    expect(getByTestId('cover-renderer')).toBeTruthy();
  });
});
