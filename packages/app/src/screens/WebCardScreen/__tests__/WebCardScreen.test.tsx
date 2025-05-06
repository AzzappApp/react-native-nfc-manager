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

jest.mock('react-native-compressor', () => ({
  getVideoMetaData: jest.fn(),
}));

describe('WebCardScreen', () => {
  const environment: RelayMockEnvironment = createMockEnvironment();

  const renderWebCardScreen = (
    webCardId = 'webCardId',
    viewerWebCardId = 'viewerWebCardId',
  ) => {
    const preloadedQuery = loadQuery<WebCardScreenByIdQuery>(
      environment,
      WebCardScreenByIdQueryNode,
      { webCardId, viewerWebCardId },
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
          ... on WebCard @alias(as: "webCard") {
            id
            userName
            cardIsPublished
            cardColors {
              otherColors
            }
            ...CoverRenderer_webCard
            ...WebCardPreviewFullScreenOverlay_webCard
          }
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
          cardStyle: {
            borderRadius: 10,
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
      },
    );

    const { queryAllByTestId } = renderWebCardScreen('webCardId-1');
    act(() => {
      jest.runAllTimers();
    });
    expect(queryAllByTestId('cover-renderer').length).toBeGreaterThan(0);
  });
});
