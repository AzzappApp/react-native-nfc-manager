import { screen, act, fireEvent } from '@testing-library/react-native';
import * as MediaLibrary from 'expo-media-library';
import { flushPromises } from '@azzapp/shared/jestHelpers';
import { render } from '#helpers/testHelpers';
import PhotoGalleryMediaList from '../PhotoGalleryMediaList';

const ALBUM: MediaLibrary.Album = {
  approximateLocation: undefined,
  assetCount: 79,
  endTime: 0,
  id: '87574209-EE20-4693-832B-4CBB661F48F9',
  locationNames: [],
  startTime: 0,
  title: 'Recents',
  type: 'smartAlbum',
};
//

jest.mock('expo-media-library', () => ({
  getAssetsAsync: jest.fn().mockReturnValue({
    assets: Array.from({ length: 16 }).map((_, i) => ({
      creationTime: 1686990164966,
      duration: 0,
      filename: 'IMG_0016.JPEG',
      height: 1536,
      id: i.toString(),
      mediaSubtypes: [],
      mediaType: i % 2 ? 'photo' : 'video',
      modificationTime: 1687692958643,
      uri: i.toString(),
      width: 2048,
    })),
    endCursor: '16',
    hasNextPage: false,
    totalCount: 16,
  }),
  getAssetInfoAsync: jest
    .fn()
    .mockReturnValue({ localUri: 'localUri', mediaType: 'image' }),
}));

describe('PhotoGalleryMediaList', () => {
  test('Should render the list of media from the expo-media-library', async () => {
    render(
      <PhotoGalleryMediaList
        kind="image"
        onMediaSelected={() => void 0}
        album={null}
      />,
    );

    await act(flushPromises);
    expect(screen.getAllByRole('button')).toHaveLength(16);
  });

  test('Should fetch more media if end is reached', async () => {
    jest.spyOn(MediaLibrary, 'getAssetsAsync').mockReturnValue({
      // @ts-expect-error mock promise
      assets: Array.from({ length: 50 }).map((_, i) => ({
        creationTime: 1686990164966,
        duration: 0,
        filename: 'IMG_0016.JPEG',
        height: 1536,
        id: i.toString(),
        mediaSubtypes: [],
        mediaType: 'photo',
        modificationTime: 1687692958643,
        uri: i.toString(),
        width: 2048,
      })),
      endCursor: '16',
      hasNextPage: true,
      totalCount: 50,
    });
    render(
      <PhotoGalleryMediaList
        kind="image"
        onMediaSelected={() => void 0}
        album={null}
      />,
    );
    await act(flushPromises);
    expect(MediaLibrary.getAssetsAsync).toHaveBeenCalledTimes(1);
    const list = screen.getByTestId('photo-gallery-list');
    act(() => {
      fireEvent.scroll(list, {
        nativeEvent: {
          contentOffset: {
            y: 800,
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

    expect(MediaLibrary.getAssetsAsync).toHaveBeenCalledTimes(2);
  });

  test('Should filter media by album and kind if given', async () => {
    // We won't use the result anyway

    render(
      <PhotoGalleryMediaList
        kind="video"
        onMediaSelected={() => void 0}
        album={null}
      />,
    );

    await act(flushPromises);
    expect(MediaLibrary.getAssetsAsync).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        mediaType: ['video'],
      }),
    );

    render(
      <PhotoGalleryMediaList
        kind="mixed"
        onMediaSelected={() => void 0}
        album={null}
      />,
    );
    await act(flushPromises);
    expect(MediaLibrary.getAssetsAsync).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        mediaType: ['photo', 'video'],
      }),
    );

    render(
      <PhotoGalleryMediaList
        kind="mixed"
        album={ALBUM}
        onMediaSelected={() => void 0}
      />,
    );
    await act(flushPromises);
    expect(MediaLibrary.getAssetsAsync).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        mediaType: ['photo', 'video'],
        album: ALBUM,
      }),
    );
  });

  test('Should call onMediaSelected when a media is selected', async () => {
    const onSelect = jest.fn();
    render(
      <PhotoGalleryMediaList
        kind="image"
        onMediaSelected={onSelect}
        album={null}
      />,
    );

    await act(flushPromises);

    const button = screen.getAllByRole('button')[3];
    fireEvent.press(button);
    await flushPromises();
    expect(onSelect).toHaveBeenCalledWith({
      galleryUri: '0',
      uri: 'localUri',
      kind: 'image',
      width: 2048,
      height: 1536,
    });
  });
});
