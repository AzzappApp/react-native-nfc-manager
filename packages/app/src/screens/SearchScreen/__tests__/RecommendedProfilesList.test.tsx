import '@testing-library/jest-native/extend-expect';

import {
  graphql,
  RelayEnvironmentProvider,
  useLazyLoadQuery,
} from 'react-relay';
import { createMockEnvironment, MockPayloadGenerator } from 'relay-test-utils';
import { act, fireEvent, render, screen, waitFor } from '#helpers/testHelpers';

import RecommendedProfilesList from '../RecommendedProfilesList';
import type { CoverRendererProps } from '#components/CoverRenderer';
import type { RecommendedProfilesListTestQuery } from '@azzapp/relay/artifacts/RecommendedProfilesListTestQuery.graphql';

jest.mock('#ui/ViewTransition', () => 'ViewTransition');

jest.mock('#components/CoverLink', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createElement } = require('react');
  function CoverLink(
    props: CoverRendererProps & {
      userId: string;
    },
  ) {
    return createElement('CoverLink', {
      userId: props.userId,
      style: props.style,
      testID: 'CoverLink',
    });
  }

  return CoverLink;
});

const CARD = {
  cover: {
    backgroundColor: '#FA3',
    overlayEffect: 'wave',
    title: 'fake title',
    subTitle: 'fake subtitle',
    media: {
      __typename: 'MediaImage',
      id: 'fakeSource0',
    },
  },
};

const renderScreen = () => {
  const environment = createMockEnvironment();

  environment.mock.queueOperationResolver(operation => {
    return MockPayloadGenerator.generate(operation, {
      PageInfo() {
        return {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
          endCursor: 'YXJyYXljb25uZWN0aW9uOjE=',
        };
      },

      Viewer(_, generateId) {
        return {
          recommendedProfiles: {
            edges: [
              {
                cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                node: {
                  id: String(generateId()),
                  userName: 'username1',
                  card: CARD,
                },
              },
              ...[1, 2, 3, 4, 5, 6, 7, 8].map((_, index) => {
                return {
                  node: {
                    id: String(generateId()),
                    userName: `username_${index}`,
                    card: CARD,
                  },
                };
              }),
              {
                cursor: 'YXJyYXljb25uZWN0aW9uOjE=',
                node: {
                  id: String(generateId()),
                  userName: 'username9',
                  card: CARD,
                },
              },
              {
                node: {
                  id: String(generateId()),
                  userName: 'username11',
                  card: CARD,
                },
              },
              {
                node: {
                  id: String(generateId()),
                  userName: 'username12',
                  card: CARD,
                },
              },
              {
                node: {
                  id: String(generateId()),
                  userName: 'username13',
                  card: CARD,
                },
              },
            ],
          },
        };
      },
    });
  });

  const TestRenderer = () => {
    const data = useLazyLoadQuery<RecommendedProfilesListTestQuery>(
      graphql`
        query RecommendedProfilesListTestQuery @relay_test_operation {
          viewer {
            ...RecommendedProfilesList_viewer
          }
        }
      `,
      {},
    );

    return <RecommendedProfilesList viewer={data.viewer} />;
  };

  const component = render(
    <RelayEnvironmentProvider environment={environment}>
      <TestRenderer />
    </RelayEnvironmentProvider>,
  );

  return {
    rerender() {
      component.rerender(
        <RelayEnvironmentProvider environment={environment}>
          <TestRenderer />
        </RelayEnvironmentProvider>,
      );
    },
  };
};

const eventData = {
  nativeEvent: {
    contentInset: { bottom: 0, left: 0, right: 0, top: 0 },
    contentOffset: { x: 2489, y: 0 },
    contentSize: { height: 200, width: 2970 },
    layoutMeasurement: { height: 200, width: 380 },
    zoomScale: 1,
  },
};

describe('Recommended Profiles list Component', () => {
  test('should render initial list and loadMore after scrolling', async () => {
    renderScreen();
    const list = screen.getByTestId('cover-list');

    const coverLinks = screen.getAllByTestId('CoverLink');
    expect(coverLinks).toHaveLength(5);
    expect(coverLinks[0]).toHaveStyle({ width: 80 });

    act(() => {
      fireEvent(list, 'scroll', eventData);
    });

    await waitFor(() =>
      expect(screen.getAllByTestId('CoverLink')).toHaveLength(13),
    );
  });
});
