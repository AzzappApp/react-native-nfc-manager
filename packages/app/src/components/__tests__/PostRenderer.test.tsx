import { render, screen } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import {
  graphql,
  RelayEnvironmentProvider,
  useLazyLoadQuery,
} from 'react-relay';
import { createMockEnvironment, MockPayloadGenerator } from 'relay-test-utils';
import PostRenderer from '../PostRenderer';

import type {
  MediaImageRendererProps,
  MediaVideoRendererHandle,
  MediaVideoRendererProps,
} from '../medias';
import type { PostRendererProps } from '../PostRenderer';
import type { PostRendererTestQuery } from '@azzapp/relay/artifacts/PostRendererTestQuery.graphql';
import type { ForwardedRef } from 'react';

jest.useFakeTimers();
let mockMediaHandles: Record<string, any> = {};

jest.mock('#components/medias/NativeMediaImageRenderer');
jest.mock('#components/medias/NativeMediaVideoRenderer');

jest.mock('#components/medias', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { forwardRef, useImperativeHandle, createElement } = require('react');
  function MediaVideoRenderer(
    props: MediaVideoRendererProps,
    ref: ForwardedRef<MediaVideoRendererHandle>,
  ) {
    useImperativeHandle(ref, () => mockMediaHandles[props.source], [
      props.source,
    ]);
    return createElement('MediaVideoRenderer', {
      ...props,
      testID: props.source,
    });
  }
  function MediaImageRenderer(
    props: MediaImageRendererProps,
    ref: ForwardedRef<MediaVideoRendererHandle>,
  ) {
    useImperativeHandle(ref, () => mockMediaHandles[props.source], [
      props.source,
    ]);
    return createElement('MediaImageRenderer', {
      ...props,
      testID: props.source,
    });
  }
  return {
    MediaVideoRenderer: forwardRef(MediaVideoRenderer),
    MediaImageRenderer: forwardRef(MediaImageRenderer),
  };
});
jest.mock('#ui/ViewTransition', () => 'ViewTransition');
jest.mock('../Link', () => 'Link');

const renderPost = (props?: Partial<PostRendererProps>) => {
  const environement = createMockEnvironment();
  environement.mock.queueOperationResolver(operation =>
    MockPayloadGenerator.generate(operation, {
      Post(_, generateId) {
        return {
          id: String(generateId()),
          author: { id: 'azzapp', userName: 'azzap' },
          postDate: 123123123,
          media: {
            __typename: 'MediaVideo',
            id: 'fakeSource0',
          },
          content: 'post content',
          allowComments: true,
          allowLikes: false,
        };
      },
    }),
  );

  const TestRenderer = (props?: Partial<PostRendererProps>) => {
    const data = useLazyLoadQuery<PostRendererTestQuery>(
      graphql`
        query PostRendererTestQuery @relay_test_operation {
          post: node(id: "test-post") {
            id
            ...PostRendererFragment_post
            ... on Post {
              author {
                ...PostRendererFragment_author
              }
            }
          }
        }
      `,
      {},
    );
    if (data?.post?.author) {
      return (
        <PostRenderer
          post={data.post}
          width={30}
          author={data?.post?.author}
          style={{ marginTop: 10 }}
          initialTime={0}
          {...props}
        />
      );
    }
    return null;
  };
  const component = render(
    <RelayEnvironmentProvider environment={environement}>
      <TestRenderer {...props} />
    </RelayEnvironmentProvider>,
  );

  return {
    rerender(updates?: Partial<PostRendererProps>) {
      component.rerender(
        <RelayEnvironmentProvider environment={environement}>
          <TestRenderer {...props} {...updates} />
        </RelayEnvironmentProvider>,
      );
    },
  };
};

describe('PostRenderer', () => {
  afterEach(() => {
    mockMediaHandles = {};
  });

  test('should display correctly and apply `props`', () => {
    renderPost();

    expect(screen.toJSON()).toHaveStyle({
      marginTop: 10,
    });
    expect(screen.queryByText('post content')).toBeTruthy();
  });

  test('should not display the `content` of the post if `small` props is true', () => {
    renderPost({ small: true });
    expect(screen.queryByText('post content')).toBeNull();
  });

  test('should display `AuthorCartouche` if `small` props is true', () => {
    renderPost({ small: true });
    expect(screen.queryByText('azzap')).toBeTruthy();
  });

  test('should set the initial video time on video media if provided', () => {
    renderPost({
      initialTime: 3,
    });
    expect(screen.queryByTestId('fakeSource0')).toHaveProp('currentTime', 3);
  });

  test('should pause the video if `paused` is true', () => {
    renderPost();
    expect(screen.getByTestId('fakeSource0')).toHaveProp('paused', false);
    renderPost({ paused: true });
    expect(screen.getByTestId('fakeSource0')).toHaveProp('paused', true);
  });

  test('should mute the video if `muted` is true', () => {
    renderPost();
    expect(screen.getByTestId('fakeSource0')).toHaveProp('muted', false);
    renderPost({ muted: true });
    expect(screen.getByTestId('fakeSource0')).toHaveProp('muted', true);
  });
});
