import { fireEvent, render, screen, act } from '@testing-library/react-native';
import MediaImageRenderer from '../MediaImageRenderer';
import '@testing-library/jest-native/extend-expect';

jest.mock('../NativeMediaImageRenderer', () => 'NativeMediaImageRenderer');
describe('MediaImageRenderer', () => {
  it('should render a NativeMediaImageRenderer with correct role and label', () => {
    render(
      <MediaImageRenderer
        source="id-1"
        width={200}
        aspectRatio={2}
        uri="https://fake-uri.com/id-1.jpg"
        alt="An image"
      />,
    );
    const image = screen.getByRole('image');
    expect(image).toHaveProp('accessibilityLabel', 'An image');
    expect(image).toHaveStyle({ width: 200, aspectRatio: 2 });
  });

  it('should dispatch onReadyForDisplay only once for each requested media', () => {
    const onReadyForDisplay = jest.fn();
    const element = render(
      <MediaImageRenderer
        source="id-1"
        width={200}
        aspectRatio={2}
        uri="https://fake-uri.com/id-1.jpg"
        alt="An image"
        onReadyForDisplay={onReadyForDisplay}
      />,
    );
    const image = screen.getByRole('image');
    act(() => {
      fireEvent(image, 'placeHolderImageLoad');
    });
    expect(onReadyForDisplay).toHaveBeenCalledTimes(1);
    act(() => {
      fireEvent(image, 'load');
    });
    expect(onReadyForDisplay).toHaveBeenCalledTimes(1);

    //don't change the uri
    element.update(
      <MediaImageRenderer
        source="id-1"
        width={200}
        aspectRatio={2}
        uri="https://fake-uri.com/id-1.jpg"
        alt="An image"
        onReadyForDisplay={onReadyForDisplay}
      />,
    );
    act(() => {
      fireEvent(image, 'load');
    });
    expect(onReadyForDisplay).toHaveBeenCalledTimes(1);

    // change the uri
    element.update(
      <MediaImageRenderer
        source="id-2"
        width={200}
        aspectRatio={2}
        uri="https://fake-uri.com/id-2.jpg"
        alt="An image"
        onReadyForDisplay={onReadyForDisplay}
      />,
    );
    act(() => {
      fireEvent(image, 'load');
    });
    expect(onReadyForDisplay).toHaveBeenCalledTimes(2);
    act(() => {
      fireEvent(image, 'placeHolderImageLoad');
    });
    expect(onReadyForDisplay).toHaveBeenCalledTimes(2);
  });
});
