import { render, screen } from '@testing-library/react-native';
import {
  graphql,
  RelayEnvironmentProvider,
  useLazyLoadQuery,
} from 'react-relay';
import { createMockEnvironment, MockPayloadGenerator } from 'relay-test-utils';
import PostRendererMedia from '#components/PostList/PostRendererMedia';
import type { PostRendererMediaProps } from '#components/PostList/PostRendererMedia';
import type { PostRendererMediaTestQuery } from '#relayArtifacts/PostRendererMediaTestQuery.graphql';

jest.mock('#components/medias/MediaVideoRenderer', () => 'MediaVideoRenderer');
jest.mock('#components/medias/MediaImageRenderer', () => 'MediaImageRenderer');

const renderPost = (props?: Partial<PostRendererMediaProps>) => {
  const environement = createMockEnvironment();
  environement.mock.queueOperationResolver(operation =>
    MockPayloadGenerator.generate(operation, {
      Post(_, generateId) {
        return {
          id: String(generateId()),
          media: {
            __typename: 'MediaVideo',
            id: 'fakeSource0',
          },
        };
      },
    }),
  );

  const TestRenderer = (props?: Partial<PostRendererMediaProps>) => {
    const data = useLazyLoadQuery<PostRendererMediaTestQuery>(
      graphql`
        query PostRendererMediaTestQuery @relay_test_operation {
          node(id: "test-post") {
            ... on Post @alias(as: "post") {
              id
              ...PostRendererMediaFragment_post
            }
          }
        }
      `,
      {},
    );

    return data.node?.post ? (
      <PostRendererMedia
        post={data.node.post}
        width={30}
        style={{ marginTop: 10 }}
        initialTime={0}
        {...props}
      />
    ) : null;
  };
  return render(
    <RelayEnvironmentProvider environment={environement}>
      <TestRenderer {...props} />
    </RelayEnvironmentProvider>,
  );
};

describe('PostRendererMedia', () => {
  test('should set the initial video time on video media if provided', () => {
    renderPost({
      initialTime: 3,
    });
    expect(screen.getByTestId('PostRendererMedia_media')).toHaveProp(
      'currentTime',
      3,
    );
  });

  test('should pause the video if `paused` is true', () => {
    renderPost();
    expect(screen.getByTestId('PostRendererMedia_media')).toHaveProp(
      'paused',
      false,
    );
    renderPost({ paused: true });
    expect(screen.getByTestId('PostRendererMedia_media')).toHaveProp(
      'paused',
      true,
    );
  });

  test('should mute the video if `muted` is true', () => {
    renderPost();
    expect(screen.getByTestId('PostRendererMedia_media')).toHaveProp(
      'muted',
      false,
    );
    renderPost({ muted: true });
    expect(screen.getByTestId('PostRendererMedia_media')).toHaveProp(
      'muted',
      true,
    );
  });
});
