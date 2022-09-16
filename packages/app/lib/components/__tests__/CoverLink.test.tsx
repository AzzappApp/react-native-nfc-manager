import { act, fireEvent, render, screen } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import { View } from 'react-native';
import CoverLink from '../CoverLink';
import type { UserRoute } from '../../routes';
import type { CoverHandle, CoverRendererProps } from '../CoverRenderer';
import type { ForwardedRef } from 'react';

let mockCoverHandle: any = null;
jest.mock('../CoverRenderer', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { forwardRef, useImperativeHandle, createElement } = require('react');
  function CoverRenderer(
    props: CoverRendererProps,
    ref: ForwardedRef<CoverHandle>,
  ) {
    useImperativeHandle(ref, () => mockCoverHandle, []);
    return createElement('CoverRenderer', {
      ...props,
      testID: 'coverRenderer',
    });
  }

  return forwardRef(CoverRenderer);
});

const mockRouter = {
  push: jest.fn(),
};
jest.mock('../../PlatformEnvironment', () => ({
  useRouter() {
    return mockRouter;
  },
}));

const mockCoverProps = {
  MOCK_COVER: 'MOCK_COVER',
} as any as CoverRendererProps;

describe('CoverLink', () => {
  afterEach(() => mockRouter.push.mockReset());
  test('should pause the transition and the video when pressed', () => {
    render(
      <CoverLink {...mockCoverProps} userName="fakeUserName" userId="fakeId" />,
    );

    const link = screen.getByRole('link');
    const cover = screen.getByTestId('coverRenderer');

    expect(cover).toHaveProp('playTransition', undefined);
    expect(cover).toHaveProp('videoPaused', undefined);

    act(() => {
      fireEvent(link, 'responderGrant', {
        persist: () => void 0,
        nativeEvent: {},
      });
    });
    expect(cover).toHaveProp('playTransition', false);
    expect(cover).toHaveProp('videoPaused', true);

    act(() => {
      fireEvent(link, 'responderTerminate', {
        persist: () => void 0,
        nativeEvent: {},
      });
    });
    expect(cover).toHaveProp('playTransition', undefined);
    expect(cover).toHaveProp('videoPaused', undefined);
  });

  test('should push to user screen without animation if cover handle is null', () => {
    mockCoverHandle = null;
    render(
      <CoverLink {...mockCoverProps} userName="fakeUserName" userId="fakeId" />,
    );

    const link = screen.getByRole('link');

    expect(mockRouter.push).not.toHaveBeenCalled();

    act(() => {
      fireEvent.press(link);
    });

    expect(mockRouter.push).toHaveBeenCalledWith({
      route: 'USER',
      params: { userName: 'fakeUserName' },
    });
  });

  test('should push to user screen with animation if cover handle is present', () => {
    jest.useFakeTimers();
    mockCoverHandle = {
      getCurrentMediaRenderer: jest.fn(),
      getCurrentImageIndex: jest.fn().mockReturnValue(1),
      getCurrentVideoTime: jest.fn().mockReturnValue(3.4),
      snapshot: jest.fn(),
    };
    let setOriginCoverState: any = null;
    mockRouter.push.mockImplementationOnce((route: UserRoute) => {
      setOriginCoverState = route.params.setOriginCoverState;
    });
    (View.prototype.measureInWindow as jest.Mock).mockImplementationOnce(
      callback => {
        callback(100, 30, 125, 200);
      },
    );

    render(
      <CoverLink {...mockCoverProps} userName="fakeUserName" userId="fakeId" />,
    );

    const link = screen.getByRole('link');

    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(mockCoverHandle.snapshot).not.toHaveBeenCalled();

    act(() => {
      fireEvent.press(link);
      jest.runAllTicks();
    });
    expect(mockRouter.push).toHaveBeenCalledWith({
      route: 'USER',
      params: {
        userName: 'fakeUserName',
        userId: 'fakeId',
        imageIndex: 1,
        videoTime: 3.4,
        fromRectangle: { x: 100, y: 30, width: 125, height: 200 },
        setOriginCoverState: expect.any(Function),
      },
    });
    expect(mockCoverHandle.snapshot).toHaveBeenCalled();

    const cover = screen.getByTestId('coverRenderer');
    expect(cover).not.toHaveProp('imageIndex', 2);
    expect(cover).toHaveProp('initialVideosTimes', null);

    act(() => {
      setOriginCoverState({
        imageIndex: 2,
        videoTime: 6.7,
      });
    });
    expect(cover).toHaveProp('imageIndex', 2);
    expect(cover).toHaveProp('initialVideosTimes', { [2]: 6.7 });
  });
});
