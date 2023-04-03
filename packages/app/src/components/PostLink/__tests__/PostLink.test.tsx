import { act, fireEvent, render, screen } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import { View } from 'react-native';
import PostLink from '../PostLink';

import type { PostRendererHandle, PostRendererProps } from '../../PostRenderer';
import type { ForwardedRef } from 'react';

let mockPostHandle: any = null;

jest.mock('../../PostRenderer', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { forwardRef, useImperativeHandle, createElement } = require('react');
  function PostRenderer(
    props: PostRendererProps,
    ref: ForwardedRef<PostRendererHandle>,
  ) {
    useImperativeHandle(ref, () => mockPostHandle, []);
    return createElement('PostRenderer', {
      ...props,
      testID: 'postRenderer',
    });
  }

  return forwardRef(PostRenderer);
});

const mockRouter = {
  push: jest.fn(),
};
jest.mock('#PlatformEnvironment', () => ({
  useRouter() {
    return mockRouter;
  },
}));

const mockPostProps = {
  MOCK_POST: 'MOCK_POST',
} as any;

describe('PostLink', () => {
  afterEach(() => mockRouter.push.mockReset());
  test('should pause the transition and the video when pressed', () => {
    render(<PostLink {...mockPostProps} postId="fakeId" />);

    const link = screen.getByRole('link');
    const Post = screen.getByTestId('postRenderer');

    expect(Post).toHaveProp('paused', undefined);

    act(() => {
      fireEvent(link, 'responderGrant', {
        persist: () => void 0,
        nativeEvent: {},
      });
    });

    expect(Post).toHaveProp('paused', true);

    act(() => {
      fireEvent(link, 'responderTerminate', {
        persist: () => void 0,
        nativeEvent: {},
      });
    });

    expect(Post).toHaveProp('paused', undefined);
  });

  test('should push to post screen without animation if Post handle is null', () => {
    mockPostHandle = null;
    render(<PostLink {...mockPostProps} postId="fakeId" />);

    const link = screen.getByRole('link');

    expect(mockRouter.push).not.toHaveBeenCalled();

    act(() => {
      fireEvent.press(link);
    });

    expect(mockRouter.push).toHaveBeenCalledWith({
      route: 'POST',
      params: { postId: 'fakeId' },
    });
  });

  test('should push to post screen with animation if Post handle is present', async () => {
    mockPostHandle = {
      getCurrentMediaRenderer: jest.fn(),
      getCurrentVideoTime: jest.fn().mockReturnValue(3.4),
      snapshot: jest.fn(),
    };

    (View.prototype.measureInWindow as jest.Mock).mockImplementationOnce(
      callback => {
        callback(100, 30, 125, 200);
      },
    );
    render(<PostLink {...mockPostProps} postId="fakeId" />);

    const link = screen.getByRole('link');

    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(mockPostHandle.snapshot).not.toHaveBeenCalled();

    await act(() => {
      fireEvent.press(link);
    });

    expect(mockRouter.push).toHaveBeenCalledWith({
      route: 'POST',
      params: {
        postId: 'fakeId',
        videoTime: 3.4,
        fromRectangle: { x: 100, y: 30, width: 125, height: 200 },
      },
    });
    expect(mockPostHandle.snapshot).toHaveBeenCalled();
  });
});
