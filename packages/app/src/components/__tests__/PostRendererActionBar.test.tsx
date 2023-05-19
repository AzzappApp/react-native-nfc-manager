import {
  useLazyLoadQuery,
  graphql,
  RelayEnvironmentProvider,
} from 'react-relay';
import { createMockEnvironment, MockPayloadGenerator } from 'relay-test-utils';
import { act, fireEvent, render, screen } from '#helpers/testHelpers';
import PostRendererActionBar from '../PostRendererActionBar';
import type { PostRendererMediaProps } from '#components/PostRendererMedia';
import type { PostRendererActionBarProps } from '../PostRendererActionBar';
import type { PostRendererActionBarTestQuery } from '@azzapp/relay/artifacts/PostRendererActionBarTestQuery.graphql';

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
  it('should update the like counter on pressing the like IconButton', async () => {
    renderActionBar();
    expect(screen.getByText('3 likes')).toBeTruthy();
    const likeButton = screen.getByRole('button');

    act(() => {
      fireEvent.press(likeButton);
    });
    expect(screen.getByText('4 likes')).toBeTruthy();
    act(() => {
      fireEvent.press(likeButton);
    });
    expect(screen.getByText('3 likes')).toBeTruthy();
  });
});
