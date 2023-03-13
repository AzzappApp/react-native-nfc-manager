import '@testing-library/jest-native/extend-expect';

import {
  graphql,
  RelayEnvironmentProvider,
  useLazyLoadQuery,
} from 'react-relay';
import { createMockEnvironment, MockPayloadGenerator } from 'relay-test-utils';
import { act, fireEvent, render, screen, waitFor } from '#helpers/testHelpers';

import TrendingProfilesList from '../TrendingProfilesList';
import type { CoverRendererProps } from '#components/CoverRenderer';
import type { TrendingProfilesListTestQuery } from '@azzapp/relay/artifacts/TrendingProfilesListTestQuery.graphql';

jest.mock('#ui/ViewTransition', () => 'ViewTransition');

jest.mock('#components/CoverLink', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createElement } = require('react');
  function CoverLink(
    props: CoverRendererProps & {
      profileID: string;
    },
  ) {
    return createElement('CoverLink', {
      profileID: props.profileID,
      style: props.style,
      testID: 'CoverLink',
    });
  }

  return CoverLink;
});

const CARD = {
  id: 'fakeCardId',
  __typename: 'Card',
  cover: {
    media: {
      id: 'media_id',
      largeURI: 'media_large_uri',
      smallURI: 'media_small_uri',
    },
    textPreviewMedia: {
      id: 'text_preview_media_id',
      largeURI: 'text_preview_large_uri',
      smallURI: 'text_preview_small_uri',
    },
    title: 'User card title',
    subTitle: 'User card subtitle',
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
          trendingProfiles: {
            edges: [
              {
                cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                node: {
                  id: String(generateId()),
                  userName: 'username0',
                  card: CARD,
                },
              },
              ...[1, 2, 3, 4, 5, 6, 7, 8].map((_, index) => {
                return {
                  cursor: String(generateId()),
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
    const data = useLazyLoadQuery<TrendingProfilesListTestQuery>(
      graphql`
        query TrendingProfilesListTestQuery @relay_test_operation {
          viewer {
            ...TrendingProfilesList_viewer
          }
        }
      `,
      {},
    );

    return <TrendingProfilesList viewer={data.viewer} />;
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

describe('TrendingProfilesList', () => {
  test('should render initial list and loadMore after scrolling', async () => {
    renderScreen();
    const list = screen.getByRole('list');
    const coverLinks = screen.getAllByTestId('CoverLink');
    expect(coverLinks).toHaveLength(10);
    expect(coverLinks[0]).toHaveStyle({ width: 80 });

    act(() => {
      fireEvent(list, 'scroll', eventData);
    });

    await waitFor(() => {
      expect(screen.getAllByTestId('CoverLink')).toHaveLength(13);
    });
  });
});
