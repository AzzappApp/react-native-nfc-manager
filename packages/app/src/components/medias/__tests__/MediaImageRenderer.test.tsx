import { fireEvent, render, act } from '@testing-library/react-native';
import MediaImageRenderer from '../MediaImageRenderer';

jest.mock('../NativeMediaImageRenderer', () => 'NativeMediaImageRenderer');

describe('MediaImageRenderer', () => {
  it('should render a NativeMediaImageRenderer with correct role and label', () => {
    const { root } = render(
      <MediaImageRenderer
        source={{
          uri: 'https://fake-uri.com/id-1.jpg',
          mediaId: 'id-1',
          requestedSize: 200,
        }}
        style={{
          aspectRatio: 2,
        }}
        alt="An image"
      />,
    );
    expect(root).toHaveProp('accessibilityRole', 'image');
    expect(root).toHaveProp('accessibilityLabel', 'An image');
    expect(root).toHaveStyle({ aspectRatio: 2 });
  });

  it('should dispatch onReadyForDisplay only once for each requested media', () => {
    const onReadyForDisplay = jest.fn();
    const { root, update } = render(
      <MediaImageRenderer
        source={{
          uri: 'https://fake-uri.com/id-1.jpg',
          mediaId: 'id-1',
          requestedSize: 200,
        }}
        alt="An image"
        onReadyForDisplay={onReadyForDisplay}
      />,
    );
    act(() => {
      fireEvent(root, 'placeHolderImageLoad');
    });
    expect(onReadyForDisplay).toHaveBeenCalledTimes(1);
    act(() => {
      fireEvent(root, 'load');
    });
    expect(onReadyForDisplay).toHaveBeenCalledTimes(1);

    //don't change the uri
    update(
      <MediaImageRenderer
        source={{
          uri: 'https://fake-uri.com/id-1.jpg',
          mediaId: 'id-1',
          requestedSize: 200,
        }}
        alt="An image"
        onReadyForDisplay={onReadyForDisplay}
      />,
    );
    act(() => {
      fireEvent(root, 'load');
    });
    expect(onReadyForDisplay).toHaveBeenCalledTimes(1);

    // change the uri
    update(
      <MediaImageRenderer
        source={{
          uri: 'https://fake-uri.com/id-2.jpg',
          mediaId: 'id-2',
          requestedSize: 200,
        }}
        alt="An image"
        onReadyForDisplay={onReadyForDisplay}
      />,
    );
    act(() => {
      fireEvent(root, 'load');
    });
    expect(onReadyForDisplay).toHaveBeenCalledTimes(2);
    act(() => {
      fireEvent(root, 'placeHolderImageLoad');
    });
    expect(onReadyForDisplay).toHaveBeenCalledTimes(2);
  });
});
