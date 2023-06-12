import {
  graphql,
  RelayEnvironmentProvider,
  useLazyLoadQuery,
} from 'react-relay';
import { createMockEnvironment, MockPayloadGenerator } from 'relay-test-utils';
import { act, fireEvent, render, screen, waitFor } from '#helpers/testHelpers';

import TrendingPostsList from '../TrendingPostsList';

import type { PostRendererProps } from '#components/PostRenderer';
import type { TrendingPostsListTestQuery } from '@azzapp/relay/artifacts/TrendingPostsListTestQuery.graphql';

jest.mock('#ui/ViewTransition', () => 'ViewTransition');

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.NativeModules.AZPScrollToTopInterceptor = {
    addScrollToTopInterceptor: jest.fn(),
    removeScrollToTopInterceptor: jest.fn(),
  };

  return RN;
});

jest.mock('#components/PostLink', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createElement } = require('react');
  function PostLink(
    props: PostRendererProps & {
      postId: string;
    },
  ) {
    return createElement('PostLink', {
      ...props,
      testID: 'PostLink',
    });
  }

  return PostLink;
});

const FAKE_POST = {
  content: 'fake content',
  postDate: 123123123123,
  allowComments: true,
  allowLIkes: true,
  author: {
    userName: 'fake name',
  },
  media: {
    //  id: String(generateId()),
    __typename: 'MediaVideo',
    id: 'fakeSource-0',
    aspectRatio: 1,
    uri: 'fakeUri',
    thumbnail: 'fakeThumbnail',
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
          trendingPosts: {
            edges: [
              {
                cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                node: {
                  id: String(generateId()),
                  ...FAKE_POST,
                },
              },

              ...[1, 2, 3, 4, 5, 6].map(() => {
                return {
                  cursor: String(generateId()),
                  node: {
                    id: String(generateId()),
                    ...FAKE_POST,
                  },
                };
              }),
              {
                cursor: 'YXJyYXljb25uZWN0aW9uOjE=',
                node: {
                  id: String(generateId()),
                  ...FAKE_POST,
                },
              },
            ],
          },
        };
      },
    });
  });

  const TestRenderer = () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { View } = require('react-native');
    const data = useLazyLoadQuery<TrendingPostsListTestQuery>(
      graphql`
        query TrendingPostsListTestQuery @relay_test_operation {
          viewer {
            ...TrendingPostsList_viewer
          }
        }
      `,
      {},
    );

    return (
      <TrendingPostsList
        viewer={data.viewer}
        canPlay={false}
        ListHeaderComponent={
          <View testID="listheadertestId" style={{ height: 30 }} />
        }
      />
    );
  };

  return render(
    <RelayEnvironmentProvider environment={environment}>
      <TestRenderer />
    </RelayEnvironmentProvider>,
  );
};

const eventData = {
  nativeEvent: {
    contentOffset: {
      y: 1000,
    },
    contentSize: {
      height: 1000,
      width: 400,
    },
    layoutMeasurement: {
      height: 1000,
      width: 400,
    },
  },
};

describe('TendingPostsList', () => {
  test('should render initial list and loadMore after scrolling', async () => {
    renderScreen();

    const list = screen.getByTestId('post-grid-container');
    act(() => {
      fireEvent(list, 'layout', {
        nativeEvent: { layout: { width: 400, height: 800 } },
      });
    });
    const postLinks = screen.getAllByTestId('PostLink');
    const initialPostId = postLinks.map(postLink => {
      return postLink.props.postId;
    });
    expect(postLinks).toHaveLength(6);

    fireEvent.scroll(list, eventData);
    await waitFor(() => {
      expect(screen.getAllByTestId('PostLink')).toHaveLength(6);
    });

    expect(screen.getAllByTestId('PostLink')).toHaveLength(6);
    const scrolledPostId = postLinks.map(postLink => {
      return postLink.props.postId;
    });
    //number of post are equal, some a recycled, postIds should be different
    expect(initialPostId).not.toEqual(scrolledPostId);
  });

  test('should render the `ListHeaderComponent`', async () => {
    renderScreen();
    expect(screen.getAllByTestId('listheadertestId')).toBeTruthy();
  });
});
