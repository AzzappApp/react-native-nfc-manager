import {
  useLazyLoadQuery,
  graphql,
  RelayEnvironmentProvider,
} from 'react-relay';
import { createMockEnvironment, MockPayloadGenerator } from 'relay-test-utils';
import { act, fireEvent, render, screen } from '#helpers/testHelpers';
import PostRendererActionBar from '../PostList/PostRendererActionBar';
import type { PostRendererMediaProps } from '#components/PostList/PostRendererMedia';
import type { PostRendererActionBarProps } from '../PostList/PostRendererActionBar';
import type { PostRendererActionBarTestQuery } from '@azzapp/relay/artifacts/PostRendererActionBarTestQuery.graphql';

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
  share: mockShare,
}));

const renderActionBar = (props?: Partial<PostRendererActionBarProps>) => {
  const environement = createMockEnvironment();
  environement.mock.queueOperationResolver(operation =>
    MockPayloadGenerator.generate(operation, {
      Post(_, generateId) {
        return {
          id: String(generateId()),
          viewerPostReaction: null,
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
          post: node(id: "test-post") {
            id
            ...PostRendererActionBar_post
          }
        }
      `,
      {},
    );
    return <PostRendererActionBar postKey={data.post!} {...props} />;
  };
  const component = render(
    <RelayEnvironmentProvider environment={environement}>
      <TestRenderer {...props} />
    </RelayEnvironmentProvider>,
  );

  return {
    rerender(updates?: Partial<PostRendererMediaProps>) {
      component.rerender(
        <RelayEnvironmentProvider environment={environement}>
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
