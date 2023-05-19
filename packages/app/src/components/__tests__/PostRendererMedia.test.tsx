import { render, screen } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import {
  graphql,
  RelayEnvironmentProvider,
  useLazyLoadQuery,
} from 'react-relay';
import { createMockEnvironment, MockPayloadGenerator } from 'relay-test-utils';
import PostRendererMedia from '#components/PostRendererMedia';
import type { PostRendererMediaProps } from '#components/PostRendererMedia';

import type {
  MediaImageRendererProps,
  MediaVideoRendererHandle,
  MediaVideoRendererProps,
} from '../medias';
import type { PostRendererMediaTestQuery } from '@azzapp/relay/artifacts/PostRendererMediaTestQuery.graphql';
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
          post: node(id: "test-post") {
            id
            ...PostRendererMediaFragment_post
          }
        }
      `,
      {},
    );

    return (
      <PostRendererMedia
        post={data.post!}
        width={30}
        style={{ marginTop: 10 }}
        initialTime={0}
        {...props}
      />
    );
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

describe('PostRendererMedia', () => {
  afterEach(() => {
    mockMediaHandles = {};
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
