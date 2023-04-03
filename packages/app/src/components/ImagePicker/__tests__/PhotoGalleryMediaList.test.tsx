import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { screen, act, fireEvent } from '@testing-library/react-native';
import { flushPromises } from '@azzapp/shared/jestHelpers';
import { getPHAssetPath } from '#helpers/mediaHelpers';
import { render } from '#helpers/testHelpers';
import PhotoGalleryMediaList from '../PhotoGalleryMediaList';

jest.mock('@react-native-camera-roll/camera-roll', () => ({
  CameraRoll: {
    getPhotos: jest.fn(),
  },
}));
jest.mock('#helpers/mediaHelpers', () => ({
  formatVideoTime: jest.fn(),
  getImageSize: jest.fn(),
  getPHAssetPath: jest.fn(),
  getVideoSize: jest.fn(),
}));

const getPhotos = CameraRoll.getPhotos as jest.Mock;

describe('PhotoGalleryMediaList', () => {
  afterEach(() => {
    getPhotos.mockReset();
  });

  test('Should render the list of media from the camera roll', async () => {
    getPhotos.mockResolvedValueOnce({
      edges: Array.from({ length: 10 }).map((_, i) => ({
        node: {
          type: 'image/jpeg',
          group_name: 'Camera',
          image: {
            uri: `https://fakeuri.com/image${i}.jpg`,
            type: 'image/jpeg',
            width: i * 100,
            height: (i * 100) / 2,
          },
        },
      })),

      page_info: {
        has_next_page: false,
      },
    });

    render(
      <PhotoGalleryMediaList
        kind="image"
        onGalleryPermissionFail={() => void 0}
        onMediaSelected={() => void 0}
      />,
    );

    await act(flushPromises);

    expect(screen.getAllByRole('button')).toHaveLength(10);
  });

  // TODO onEndReached never called
  xtest('Should fetch more media if end is reached', async () => {
    getPhotos.mockResolvedValueOnce({
      edges: Array.from({ length: 10 }).map((_, i) => ({
        node: {
          type: 'image/jpeg',
          group_name: 'Camera',
          image: {
            uri: `https://fakeuri.com/image${i}.jpg`,
            type: 'image/jpeg',
            width: i * 100,
            height: (i * 100) / 2,
          },
        },
      })),

      page_info: {
        has_next_page: true,
      },
    });

    const { root } = render(
      <PhotoGalleryMediaList
        kind="image"
        onGalleryPermissionFail={() => void 0}
        onMediaSelected={() => void 0}
      />,
    );
    await act(flushPromises);
    expect(getPhotos).toHaveBeenCalledTimes(1);

    getPhotos.mockResolvedValueOnce({
      edges: Array.from({ length: 10 }).map((_, i) => ({
        node: {
          type: 'image/jpeg',
          group_name: 'Camera',
          image: {
            uri: `https://fakeuri.com/image${i + 10}.jpg`,
            type: 'image/jpeg',
            width: i * 100,
            height: (i * 100) / 2,
          },
        },
      })),

      page_info: {
        has_next_page: false,
      },
    });

    act(() => {
      fireEvent.scroll(root, {
        nativeEvent: {
          contentOffset: {
            y: 420,
          },
          contentSize: {
            height: 500,
            width: 100,
          },
          layoutMeasurement: {
            height: 100,
            width: 100,
          },
        },
      });
    });
    await act(flushPromises);

    expect(getPhotos).toHaveBeenCalledTimes(2);
    expect(screen.getAllByRole('button')).toHaveLength(20);
  });

  test('Should filter media by album and kind if given', async () => {
    // We won't use the result anyway
    getPhotos.mockResolvedValue({
      edges: [],
      page_info: { end_cursor: 0, has_next_page: false },
    });
    render(
      <PhotoGalleryMediaList
        kind="image"
        onGalleryPermissionFail={() => void 0}
        onMediaSelected={() => void 0}
      />,
    );
    await act(flushPromises);
    expect(getPhotos).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        assetType: 'Photos',
      }),
    );

    render(
      <PhotoGalleryMediaList
        kind="video"
        onGalleryPermissionFail={() => void 0}
        onMediaSelected={() => void 0}
      />,
    );
    await act(flushPromises);
    expect(getPhotos).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        assetType: 'Videos',
      }),
    );

    render(
      <PhotoGalleryMediaList
        kind="mixed"
        onGalleryPermissionFail={() => void 0}
        onMediaSelected={() => void 0}
      />,
    );
    await act(flushPromises);
    expect(getPhotos).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        assetType: 'All',
      }),
    );

    render(
      <PhotoGalleryMediaList
        kind="mixed"
        album="Camera"
        onGalleryPermissionFail={() => void 0}
        onMediaSelected={() => void 0}
      />,
    );
    await act(flushPromises);
    expect(getPhotos).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        assetType: 'All',
        groupName: 'Camera',
      }),
    );
  });

  test('Should call onMediaSelected when a media is selected', async () => {
    getPhotos.mockResolvedValueOnce({
      edges: Array.from({ length: 10 }).map((_, i) => ({
        node: {
          type: 'image/jpeg',
          group_name: 'Camera',
          image: {
            uri: `https://fakeuri.com/image${i}.jpg`,
            type: 'image/jpeg',
            width: i * 100,
            height: (i * 100) / 2,
          },
        },
      })),

      page_info: {
        has_next_page: false,
      },
    });

    const onSelect = jest.fn();
    render(
      <PhotoGalleryMediaList
        kind="image"
        onGalleryPermissionFail={() => void 0}
        onMediaSelected={onSelect}
      />,
    );

    await act(flushPromises);

    (getPHAssetPath as jest.Mock).mockResolvedValueOnce(
      'file://fakeuri.com/image3.jpg',
    );
    const button = screen.getAllByRole('button')[3];
    fireEvent.press(button);
    await flushPromises();
    expect(onSelect).toHaveBeenCalledWith({
      galleryUri: `https://fakeuri.com/image3.jpg`,
      kind: 'image',
      uri: 'file://fakeuri.com/image3.jpg',
      width: 300,
      height: 150,
      duration: undefined,
    });
  });

  test('Should call onGalleryPermissionFail when permission is denied', async () => {
    getPhotos.mockRejectedValueOnce(new Error('Permission denied'));
    const onFail = jest.fn();
    render(
      <PhotoGalleryMediaList
        kind="image"
        onGalleryPermissionFail={onFail}
        onMediaSelected={() => void 0}
      />,
    );

    await flushPromises();

    expect(onFail).toHaveBeenCalled();
  });

  xtest('Should call onGalleryPermissionFail when permission is denied on Android', () => {
    // TODO: Find a way to mock the Platform module
  });
});
