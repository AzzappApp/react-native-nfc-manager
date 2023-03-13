import { act, fireEvent, render, screen } from '@testing-library/react-native';
import MediaVideoRenderer from '../MediaVideoRenderer';
import '@testing-library/jest-native/extend-expect';

jest.mock('../NativeMediaVideoRenderer', () => 'NativeMediaVideoRenderer');
jest.mock('../NativeMediaImageRenderer', () => 'NativeMediaImageRenderer');
jest.mock('#components/SnapshotView', () => 'SnapshotView');

describe('MediaVideoRenderer', () => {
  it('should render a NativeMediaVideoRenderer with correct role and label', () => {
    render(
      <MediaVideoRenderer
        source="id-1"
        width={200}
        aspectRatio={2}
        uri="https://fake-uri.com/id-1.mp4"
        alt="A video"
      />,
    );
    expect(screen.queryByLabelText('A video')).toBeTruthy();
  });

  it('should render the thumbnail URI while the video load', () => {
    render(
      <MediaVideoRenderer
        source="id-1"
        width={200}
        aspectRatio={2}
        uri="https://fake-uri.com/id-1.mp4"
        thumbnailURI="https://fake-uri.com/id-1.jpg"
        alt="A video"
      />,
    );
    const thumbnail = screen.getByRole('image');
    expect(thumbnail).toHaveProp('accessibilityLabel', 'A video');
  });

  it('should hide the thumbnail once the video is ready', () => {
    const onReadyForDisplay = jest.fn();
    render(
      <MediaVideoRenderer
        source="id-1"
        width={200}
        aspectRatio={2}
        uri="https://fake-uri.com/id-1.mp4"
        thumbnailURI="https://fake-uri.com/id-1.jpg"
        alt="A video"
        onReadyForDisplay={onReadyForDisplay}
      />,
    );
    const video = screen.getAllByLabelText('A video')[0];
    expect(screen.queryByRole('image')).toBeTruthy();
    act(() => {
      fireEvent(video, 'readyForDisplay');
    });
    expect(screen.queryByRole('image')).not.toBeTruthy();
  });

  it('should dispatch onReadyForDisplay only once by requested media', () => {
    const onReadyForDisplay = jest.fn();
    const element = render(
      <MediaVideoRenderer
        source="id-1"
        width={200}
        aspectRatio={2}
        uri="https://fake-uri.com/id-1.mp4"
        thumbnailURI="https://fake-uri.com/id-1.jpg"
        alt="A video"
        onReadyForDisplay={onReadyForDisplay}
      />,
    );
    const getVideo = () => screen.getAllByLabelText('A video')[0];
    const getThumbnail = () => screen.getByRole('image');
    act(() => {
      fireEvent(getThumbnail(), 'load');
    });
    expect(onReadyForDisplay).toHaveBeenCalledTimes(1);

    act(() => {
      fireEvent(getVideo(), 'readyForDisplay');
    });
    expect(onReadyForDisplay).toHaveBeenCalledTimes(1);

    element.update(
      <MediaVideoRenderer
        source="id-2"
        width={200}
        aspectRatio={2}
        uri="https://fake-uri.com/id-2.mp4"
        thumbnailURI="https://fake-uri.com/id-2.jpg"
        alt="A video"
        onReadyForDisplay={onReadyForDisplay}
      />,
    );
    act(() => {
      fireEvent(getVideo(), 'readyForDisplay');
    });
    expect(onReadyForDisplay).toHaveBeenCalledTimes(2);

    element.update(
      <MediaVideoRenderer
        source="id-3"
        width={200}
        aspectRatio={2}
        uri="https://fake-uri.com/id-3.mp4"
        thumbnailURI="https://fake-uri.com/id-3.jpg"
        alt="A video"
        onReadyForDisplay={onReadyForDisplay}
      />,
    );
    act(() => {
      fireEvent(getThumbnail(), 'placeHolderImageLoad');
    });
    expect(onReadyForDisplay).toHaveBeenCalledTimes(3);
    act(() => {
      fireEvent(getVideo(), 'readyForDisplay');
    });
    expect(onReadyForDisplay).toHaveBeenCalledTimes(3);

    element.update(
      <MediaVideoRenderer
        source="id-3"
        width={200}
        aspectRatio={2}
        uri="https://fake-uri.com/id-3.mp4"
        thumbnailURI="https://fake-uri.com/id-3.jpg"
        alt="A video"
        onReadyForDisplay={onReadyForDisplay}
      />,
    );
    expect(screen.queryByRole('image')).not.toBeTruthy();
    act(() => {
      fireEvent(getVideo(), 'readyForDisplay');
    });
    expect(onReadyForDisplay).toHaveBeenCalledTimes(3);
  });
});
