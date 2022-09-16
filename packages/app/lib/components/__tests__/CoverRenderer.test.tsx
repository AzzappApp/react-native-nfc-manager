import EventEmitter from 'events';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import {
  graphql,
  RelayEnvironmentProvider,
  useLazyLoadQuery,
} from 'react-relay';
import { createMockEnvironment, MockPayloadGenerator } from 'relay-test-utils';
import { QR_CODE_POSITION_CHANGE_EVENT } from '../CoverRenderer/CoverLayout';
import CoverRenderer from '../CoverRenderer/CoverRenderer';
import type { CoverRendererProps, CoverHandle } from '../CoverRenderer';
import type { MediaVideoRendererHandle } from '../MediaRenderer';
import type {
  MediaImageRendererProps,
  MediaVideoRendererProps,
} from '../MediaRenderer/types';
import type { CoverRendererTestQuery } from '@azzapp/relay/artifacts/CoverRendererTestQuery.graphql';
import type { ForwardedRef } from 'react';

jest.useFakeTimers();

let mockMediaHandles: Record<string, any> = {};
jest.mock('../MediaRenderer', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { forwardRef, useImperativeHandle, createElement } = require('react');
  function MediaVideoRenderer(
    props: MediaVideoRendererProps,
    ref: ForwardedRef<MediaVideoRendererHandle>,
  ) {
    useImperativeHandle(ref, () => mockMediaHandles[props.source], [
      props.source,
    ]);
    return createElement('MediaVideoRenderer', props);
  }
  function MediaImageRenderer(
    props: MediaImageRendererProps,
    ref: ForwardedRef<MediaVideoRendererHandle>,
  ) {
    useImperativeHandle(ref, () => mockMediaHandles[props.source], [
      props.source,
    ]);
    return createElement('MediaVideoRenderer', props);
  }
  return {
    MediaVideoRenderer: forwardRef(MediaVideoRenderer),
    MediaImageRenderer: forwardRef(MediaImageRenderer),
  };
});
jest.mock('../../ui/ViewTransition', () => 'ViewTransition');

let coverRef: CoverHandle | null = null;
const renderCover = (props?: Partial<CoverRendererProps>) => {
  const environement = createMockEnvironment();
  environement.mock.queueOperationResolver(operation =>
    MockPayloadGenerator.generate(operation, {
      UserCard: (_, generateId) => ({
        id: generateId(),
        cover: {
          backgroundColor: '#FA3',
          overlayEffect: 'wave',
          title: 'fake title',
          titlePosition: 'bottomRight',
          titleFont: 'verdana',
          titleFontSize: 13,
          titleColor: '#FG3',
          titleRotation: 30,
          qrCodePosition: 'bottomLeft',
          pictures: [
            {
              __typename: 'MediaImage',
              source: 'fakeSource0',
            },
            {
              __typename: 'MediaVideo',
              source: 'fakeSource1',
            },
            {
              __typename: 'MediaImage',
              source: 'fakeSource2',
            },
          ],
          pictureTransitionTimer: 5,
        },
      }),
    }),
  );

  const TestRenderer = (props?: Partial<CoverRendererProps>) => {
    const data = useLazyLoadQuery<CoverRendererTestQuery>(
      graphql`
        query CoverRendererTestQuery @relay_test_operation {
          card: node(id: "test-id") {
            ... on UserCard {
              cover {
                ...CoverRenderer_cover
              }
            }
          }
        }
      `,
      {},
    );
    return (
      <CoverRenderer
        ref={value => {
          coverRef = value;
        }}
        cover={data.card?.cover}
        width={300}
        userName="userName"
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
    rerender(updates?: Partial<CoverRendererProps>) {
      component.rerender(
        <RelayEnvironmentProvider environment={environement}>
          <TestRenderer {...props} {...updates} />
        </RelayEnvironmentProvider>,
      );
    },
  };
};

describe('CoverRenderer', () => {
  afterEach(() => {
    mockMediaHandles = {};
  });

  const expectImageVisible = (imageIndex: number) => {
    expect(screen.getByTestId('cover-media-container-fakeSource0')).toHaveStyle(
      { opacity: imageIndex === 0 ? 1 : 0 },
    );

    expect(screen.getByTestId('cover-media-container-fakeSource1')).toHaveStyle(
      { opacity: imageIndex === 1 ? 1 : 0 },
    );

    expect(screen.getByTestId('cover-media-container-fakeSource2')).toHaveStyle(
      { opacity: imageIndex === 2 ? 1 : 0 },
    );

    expect(screen.getByTestId('cover-video-fakeSource1')).toHaveProp(
      'paused',
      imageIndex !== 1,
    );
  };

  test('should render the card overlay, title, QRCode and medias of the card', () => {
    renderCover();
    expect(screen.queryByText('fake title')).not.toBe(null);
    expect(screen.queryByTestId('cover-overlay')).not.toBe(null);
    expect(screen.queryByTestId('qr-code-button')).not.toBe(null);
    expect(screen.queryByTestId('cover-image-fakeSource0')).not.toBe(null);
    expect(screen.queryByTestId('cover-video-fakeSource1')).not.toBe(null);
    expect(screen.queryByTestId('cover-image-fakeSource2')).not.toBe(null);
  });

  test('should display only the current image if playTransition is false', () => {
    renderCover({ playTransition: false, imageIndex: 1 });
    expect(screen.queryByTestId('cover-image-fakeSource0')).toBe(null);
    expect(screen.queryByTestId('cover-video-fakeSource1')).not.toBe(null);
    expect(screen.queryByTestId('cover-image-fakeSource2')).toBe(null);
  });

  test('should set the initial video time on video media if provided', () => {
    renderCover({
      initialVideosTimes: { 1: 3.2, 2: 8 },
    });
    expect(screen.queryByTestId('cover-video-fakeSource1')).toHaveProp(
      'currentTime',
      3.2,
    );
    expect(screen.queryByTestId('cover-image-fakeSource2')).not.toHaveProp(
      'currentTime',
    );
  });

  test('should pause the video if `videoPaused` is true', () => {
    renderCover({ imageIndex: 1 });
    expect(screen.getByTestId('cover-video-fakeSource1')).toHaveProp(
      'paused',
      false,
    );
    renderCover({ videoPaused: true, imageIndex: 1 });
    expect(screen.getByTestId('cover-video-fakeSource1')).toHaveProp(
      'paused',
      true,
    );
  });

  test('should only display the current media', () => {
    renderCover();
    expectImageVisible(0);
  });

  test('should transition to next media once the cover pictureTransitionTimer is passed', () => {
    renderCover();
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expectImageVisible(1);
  });

  test('should transition to next media once the video is finished', () => {
    renderCover({ imageIndex: 1 });

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expectImageVisible(1);

    act(() => {
      fireEvent(screen.getByTestId('cover-video-fakeSource1'), 'end');
    });
    expectImageVisible(2);
  });

  test('should change the current media if imageIndex change', () => {
    const { rerender } = renderCover({ imageIndex: 0 });

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expectImageVisible(1);

    act(() => {
      rerender({ imageIndex: 0 });
    });
    expectImageVisible(1);

    act(() => {
      rerender({ imageIndex: 2 });
    });
    expectImageVisible(2);
  });

  test('should change the current media if component rerender and forceImageIndex is true', () => {
    const { rerender } = renderCover({ imageIndex: 0 });

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expectImageVisible(1);

    act(() => {
      rerender({ imageIndex: 0, forceImageIndex: true });
    });
    expectImageVisible(0);
  });

  test('should display the QR code modal when QR code button is pressed', () => {
    renderCover();
    const qrCode = screen.getByTestId('qr-code-button');
    fireEvent.press(qrCode);
    const modal = screen.queryByTestId('qr-code-modal');
    expect(modal).not.toBe(null);
    fireEvent(modal, 'requestClose');
    expect(screen.queryByTestId('qr-code-modal')).toBe(null);
  });

  test('should display the QR code button when edited', () => {
    const eventEmitter = new EventEmitter();
    jest.spyOn(eventEmitter, 'emit');
    renderCover({ eventEmitter, isEditedBlock: true });
    expect(eventEmitter.emit).not.toHaveBeenCalled();
    expect(screen.queryByTestId('qr-code-button-top')).not.toBe(null);
    expect(screen.queryByTestId('qr-code-button-bottomLeft')).not.toBe(null);
    expect(screen.queryByTestId('qr-code-button-bottomCenter')).not.toBe(null);
    const bottomRightButton = screen.queryByTestId(
      'qr-code-button-bottomRight',
    );
    expect(bottomRightButton).not.toBe(null);
    fireEvent.press(bottomRightButton);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      QR_CODE_POSITION_CHANGE_EVENT,
      'bottomRight',
    );
  });

  test('CoverHandle.getCurrentImageIndex should return the current displayed media', () => {
    renderCover();
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(coverRef?.getCurrentImageIndex()).toBe(1);
  });

  test('CoverHandle.getVideoTime should return the current video time, if the displayed media is a video', () => {
    mockMediaHandles['fakeSource0'] = {};
    mockMediaHandles['fakeSource1'] = {
      getPlayerCurrentTime: async () => 3.5,
    };

    renderCover();
    let videoTime: number | null = null;
    void coverRef?.getCurrentVideoTime().then(val => {
      videoTime = val;
    });
    jest.runAllTicks();
    expect(videoTime).toBe(null);
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    void coverRef?.getCurrentVideoTime().then(val => {
      videoTime = val;
    });
    jest.runAllTicks();
    expect(videoTime).toBe(3.5);
  });

  test('CoverHandle.snapshot should call snapshot on the current media, if implemented', () => {
    const fakeSource1Snapshot = jest.fn(async () => void 0);
    const fakeSource2Snapshot = jest.fn(async () => void 0);
    mockMediaHandles['fakeSource0'] = {
      snapshot: fakeSource1Snapshot,
    };
    mockMediaHandles['fakeSource1'] = {
      snapshot: fakeSource2Snapshot,
    };

    renderCover({ imageIndex: 0 });
    void coverRef?.snapshot();
    expect(fakeSource1Snapshot).toHaveBeenCalled();
    expect(fakeSource2Snapshot).not.toHaveBeenCalled();
  });

  test('CoverHandle.getCurrentMediaRenderer should return the current media container', () => {
    mockMediaHandles['fakeSource0'] = {};
    mockMediaHandles['fakeSource1'] = {
      getContainer: () => 'fake-container2',
    };

    renderCover();
    expect(coverRef?.getCurrentMediaRenderer()).toBe(
      mockMediaHandles['fakeSource0'],
    );
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(coverRef?.getCurrentMediaRenderer()).toBe('fake-container2');
  });
});
