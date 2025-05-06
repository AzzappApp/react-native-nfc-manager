import {
  useLazyLoadQuery,
  graphql,
  RelayEnvironmentProvider,
} from 'react-relay';
import { createMockEnvironment, MockPayloadGenerator } from 'relay-test-utils';
import { act, fireEvent, render, screen } from '#helpers/testHelpers';
import PostRendererActionBar from '../PostList/PostRendererActionBar';
import type { PostRendererMediaProps } from '#components/PostList/PostRendererMedia';
import type { PostRendererActionBarTestQuery } from '#relayArtifacts/PostRendererActionBarTestQuery.graphql';
import type { PostRendererActionBarProps } from '../PostList/PostRendererActionBar';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('#components/NativeRouter', () => {
  return {
    ...jest.requireActual('#components/NativeRouter'),
    useRouter() {
      return mockRouter;
    },
  };
});

const mockShare = jest.fn();
jest.mock('react-native/Libraries/Share/Share', () => ({
  default: {
    share: mockShare,
  },
}));

jest.mock('#helpers/authStore', () => ({
  getAuthState: () => ({
    profileInfos: { profileRole: 'owner' },
  }),
  addAuthStateListener: jest.fn(),
}));

const renderActionBar = (props?: Partial<PostRendererActionBarProps>) => {
  const environment = createMockEnvironment();
  environment.mock.queueOperationResolver(operation =>
    MockPayloadGenerator.generate(operation, {
      Post(_, generateId) {
        return {
          id: String(generateId()),
          postReaction: null,
          allowComments: true,
          allowLikes: true,
          counterReactions: 3,
        };
      },
    }),
  );

  const TestRenderer = (props?: Partial<PostRendererActionBarProps>) => {
    const data = useLazyLoadQuery<PostRendererActionBarTestQuery>(
      graphql`
        query PostRendererActionBarTestQuery @relay_test_operation {
          node(id: "test-post") {
            ... on Post @alias(as: "post") {
              id
              ...PostRendererActionBar_post
                @arguments(viewerWebCardId: "test-webCard")
            }
          }
        }
      `,
      {},
    );
    return data.node?.post ? (
      <PostRendererActionBar
        postKey={data.node.post}
        {...props}
        actionEnabled
      />
    ) : null;
  };
  const component = render(
    <RelayEnvironmentProvider environment={environment}>
      <TestRenderer {...props} />
    </RelayEnvironmentProvider>,
  );

  return {
    rerender(updates?: Partial<PostRendererMediaProps>) {
      component.rerender(
        <RelayEnvironmentProvider environment={environment}>
          <TestRenderer {...props} {...updates} />
        </RelayEnvironmentProvider>,
      );
    },
  };
};

describe('PostRendererActionBar', () => {
  afterEach(() => mockRouter.push.mockReset());
  test('should update the like counter on pressing the like IconButton', async () => {
    renderActionBar();
    expect(screen.getByText('3 likes')).toBeTruthy();
    const likeButton = screen.getAllByRole('button')[0];

    act(() => {
      fireEvent.press(likeButton);
    });
    expect(screen.getByText('4 likes')).toBeTruthy();
    act(() => {
      fireEvent.press(likeButton);
    });
    expect(screen.getByText('3 likes')).toBeTruthy();
  });

  test('should push the POST_COMMENT route on pressing comment icon', async () => {
    renderActionBar();
    expect(screen.getByText('3 likes')).toBeTruthy();
    const commentButton = screen.getAllByRole('button')[1];

    act(() => {
      fireEvent.press(commentButton);
    });
    expect(mockRouter.push).toHaveBeenCalledWith({
      params: {
        postId: expect.any(String),
      },
      route: 'POST_COMMENTS',
    });
  });

  test('should display the share component on pressing share icon', async () => {
    renderActionBar();
    expect(screen.getByText('3 likes')).toBeTruthy();
    const likeButton = screen.getAllByRole('button')[2];

    act(() => {
      fireEvent.press(likeButton);
    });

    expect(mockShare).toHaveBeenCalled();
  });
});
