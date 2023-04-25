import { flushPromises } from '@azzapp/shared/jestHelpers';
import {
  render,
  screen,
  act,
  fireEvent,
  waitForElementToBeRemoved,
} from '#helpers/testHelpers';
import useCameraPermissions from '#hooks/useCameraPermissions';
import ImagePicker from '..';
import type { ImagePickerProps } from '../ImagePicker';
import '@testing-library/jest-native/extend-expect';

jest.mock(
  '../PhotoGalleryMediaList',
  () => (props: any) =>
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('react').createElement('PhotoGalleryMediaList', {
      ...props,
      testID: 'media-list',
    }),
);

jest.mock(
  '../AlbumPicker',
  () => (props: any) =>
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('react').createElement('AlbumPicker', {
      ...props,
      testID: 'album-picker',
    }),
);

const mockCameraViewRef = {
  takePhoto: jest.fn(),
  startRecording: jest.fn(),
};

jest.mock('#components/CameraView', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const react = require('react');
  const CameraView = (props: any, _ref: any) => {
    react.useImperativeHandle(_ref, () => mockCameraViewRef);
    return react.createElement('CameraView', {
      ...props,
      testID: 'camera-view',
    });
  };

  return react.forwardRef(CameraView);
});

jest.mock(
  '#components/CameraControlPanel',
  () => (props: any) =>
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('react').createElement('CameraControlPanel', {
      ...props,
      testID: 'camera-control-panel',
    }),
);

jest.mock(
  '#components/FilterSelectionList',
  () => (props: any) =>
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('react').createElement('FilterSelectionList', {
      ...props,
      testID: 'filter-selection-list',
    }),
);

jest.mock(
  '#components/ImageEditionParametersList',
  () => (props: any) =>
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('react').createElement('ImageEditionParametersList', {
      ...props,
      testID: 'image-parameters-selection-list',
    }),
);

jest.mock(
  '#components/ImageEditionParameterControl',
  () => (props: any) =>
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('react').createElement('ImageEditionParameterControl', {
      ...props,
      testID: 'image-edition-parameter-control',
    }),
);

jest.mock('#helpers/mediaHelpers', () => ({
  getImageSize: () => ({ width: 100, height: 100 }),
  getVideoSize: () => ({ width: 1080, height: 1920 }),
}));

jest.mock('#hooks/useCameraPermissions', () =>
  jest.fn().mockReturnValue({
    cameraPermission: 'authorized',
    microphonePermission: 'authorized',
  }),
);

const withPermissionStatus = async (
  status: ReturnType<typeof useCameraPermissions>,
  callback: () => Promise<any>,
) => {
  (useCameraPermissions as jest.Mock).mockReturnValue(status);
  await callback();
  (useCameraPermissions as jest.Mock).mockReturnValue({
    cameraPermission: 'authorized',
    microphonePermission: 'authorized',
  });
};

jest.mock(
  '#components/PermissionModal',
  () => (props: any) =>
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('react').createElement('PermissionModal', {
      ...props,
      testID: 'permission-modal',
    }),
);

jest.mock(
  '#components/VideoTimelineEditor',
  () => (props: any) =>
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('react').createElement('VideoTimelineEditor', {
      ...props,
      testID: 'video-time-line-editor',
    }),
);

const renderImagePicker = async (props?: Partial<ImagePickerProps>) => {
  const picker = render(
    <ImagePicker
      onCancel={() => void 0}
      onFinished={() => void 0}
      {...props}
    />,
  );
  await act(flushPromises);
  return picker;
};

jest.mock('#components/gpu/GPUNativeMethods');

jest.mock('#components/Cropper', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { View } = require('react-native');
  const Cropper = ({ children, ...props }: any) => (
    <View {...props} testID="cropper">
      {children(props.cropData)}
    </View>
  );

  return Cropper;
});

describe('ImagePicker', () => {
  describe('SelectImageStep', () => {
    test('Should render the gallery list to allow the user to pick a media', async () => {
      await renderImagePicker();
      expect(screen.queryByTestId('media-list')).toBeTruthy();
    });

    test('Should display the media selected by the user', async () => {
      await renderImagePicker();
      const list = screen.getByTestId('media-list');

      act(() => {
        fireEvent(list, 'mediaSelected', {
          kind: 'image',
          uri: 'file://fakeuri.com/image2.jpg',
          width: 300,
          height: 500,
        });
      });

      const imageView = screen.getByTestId('image-picker-media-image');
      expect(imageView.type).toBe('AZPGPUImageView');
      expect(imageView).toHaveProp('layers', [
        expect.objectContaining({
          kind: 'image',
          uri: 'file://fakeuri.com/image2.jpg',
        }),
      ]);

      act(() => {
        fireEvent(list, 'mediaSelected', {
          kind: 'video',
          uri: 'https://fakeuri.com/video.mp4',
          width: 300,
          height: 500,
        });
      });

      await act(flushPromises);
      const videoView = screen.getByTestId('image-picker-media-video');
      expect(videoView.type).toBe('AZPGPUVideoView');
      expect(screen.getByTestId('image-picker-media-video')).toHaveProp(
        'layers',
        [
          expect.objectContaining({
            kind: 'video',
            uri: 'https://fakeuri.com/video.mp4',
          }),
        ],
      );
    });

    test('Should display a button to ask permission to access the gallery when the permission is denied', async () => {
      await renderImagePicker();
      const list = screen.getByTestId('media-list');

      act(() => {
        fireEvent(list, 'galleryPermissionFail');
      });
      const permissionModal = screen.getByTestId('permission-modal');
      expect(permissionModal).toHaveProp('visible', true);
      expect(permissionModal).toHaveProp('permissionsFor', 'gallery');
    });

    test('Should filter the list depending on the kind of media allowed', async () => {
      await renderImagePicker({ kind: 'image' });
      expect(screen.getByTestId('media-list')).toHaveProp('kind', 'image');

      await renderImagePicker({ kind: 'video' });
      expect(screen.getByTestId('media-list')).toHaveProp('kind', 'video');

      await renderImagePicker({ kind: 'mixed' });
      expect(screen.getByTestId('media-list')).toHaveProp('kind', 'mixed');
    });

    test('Should filter the list depending on the selected album', async () => {
      await renderImagePicker();
      const albumPicker = screen.getByTestId('album-picker');
      act(() => {
        fireEvent(albumPicker, 'change', 'album1');
      });
      expect(screen.getByTestId('media-list')).toHaveProp('album', 'album1');
    });

    test('Should display a toolbar that allows to switch between allowed picker mode', async () => {
      await renderImagePicker();
      expect(screen.queryAllByRole('tablist')).toBeTruthy();
      expect(screen.queryByLabelText('Photos gallery')).toBeTruthy();
      expect(screen.queryByLabelText('Take a picture')).toBeTruthy();
      expect(screen.queryByLabelText('Take a video')).toBeTruthy();

      await renderImagePicker({ kind: 'image' });
      expect(screen.queryByLabelText('Take a video')).not.toBeTruthy();
    });

    test('Should display the camera view when the user ask to take a picture', async () => {
      await renderImagePicker();
      act(() => {
        fireEvent.press(screen.getByLabelText('Take a picture'));
      });
      expect(screen.queryByTestId('camera-view')).toBeTruthy();
      expect(screen.queryByTestId('camera-control-panel')).toBeTruthy();
    });

    test('Should display permission modal when the user try to access the camera and the permission is denied', async () => {
      await renderImagePicker({ kind: 'image' });
      await withPermissionStatus(
        {
          cameraPermission: 'not-determined',
          microphonePermission: 'not-determined',
        },
        async () => {
          await renderImagePicker();
          act(() => {
            fireEvent.press(screen.getByLabelText('Take a picture'));
          });
          const permissionModal = screen.getByTestId('permission-modal');
          expect(permissionModal).toHaveProp('visible', true);
          expect(permissionModal).toHaveProp('permissionsFor', 'photo');
        },
      );
    });

    test('Should display permission modal when the user try to access the microphone and the permission is denied', async () => {
      await renderImagePicker({ kind: 'image' });
      await withPermissionStatus(
        {
          cameraPermission: 'authorized',
          microphonePermission: 'not-determined',
        },
        async () => {
          await renderImagePicker();
          act(() => {
            fireEvent.press(screen.getByLabelText('Take a video'));
          });
          const permissionModal = screen.getByTestId('permission-modal');
          expect(permissionModal).toHaveProp('visible', true);
          expect(permissionModal).toHaveProp('permissionsFor', 'video');
        },
      );
    });

    test('Should select the picture taken by the user and goes to the next step', async () => {
      await renderImagePicker();
      act(() => {
        fireEvent.press(screen.getByLabelText('Take a picture'));
      });
      const cameraControlPanel = screen.getByTestId('camera-control-panel');
      mockCameraViewRef.takePhoto.mockResolvedValueOnce(
        '/fakeuri.com/image.jpg',
      );
      act(() => {
        fireEvent(cameraControlPanel, 'takePhoto');
      });
      await act(flushPromises);
      expect(screen.getByTestId('image-picker-media-image')).toHaveProp(
        'layers',
        [
          expect.objectContaining({
            kind: 'image',
            uri: 'file:///fakeuri.com/image.jpg',
          }),
        ],
      );
      expect(screen.queryByTestId('filter-selection-list')).toBeTruthy();
    });

    test('Should select the video taken by the user and goes to the next step', async () => {
      await renderImagePicker({ kind: 'video' });
      act(() => {
        fireEvent.press(screen.getByLabelText('Take a video'));
      });
      const cameraControlPanel = screen.getByTestId('camera-control-panel');
      mockCameraViewRef.startRecording.mockReturnValueOnce({
        end: () =>
          Promise.resolve({
            path: '/fakeuri.com/video.mp4',
            size: 1000,
          }),
      });
      act(() => {
        fireEvent(cameraControlPanel, 'startRecording');
        fireEvent(cameraControlPanel, 'stopRecording');
      });
      await act(flushPromises);
      expect(screen.getByTestId('image-picker-media-video')).toHaveProp(
        'layers',
        [expect.objectContaining({ uri: 'file:///fakeuri.com/video.mp4' })],
      );
      expect(screen.queryByTestId('filter-selection-list')).toBeTruthy();
    });
  });

  const renderImagePickerToEditImageStep = async (
    props?: Partial<ImagePickerProps>,
    kind: 'image' | 'video' = 'image',
  ) => {
    await renderImagePicker(props);

    act(() => {
      fireEvent(screen.getByTestId('media-list'), 'mediaSelected', {
        kind,
        uri:
          kind === 'image'
            ? 'file://fakeuri.com/image2.jpg'
            : 'file://fakeuri.com/video2.mp4',
        width: 300,
        height: 500,
      });
    });
    act(() => {
      const button = screen.getByText('Next').parent!;
      fireEvent.press(button);
    });
    //waiting for the previous `Component` step to be full removed.
    await waitForElementToBeRemoved(() => screen.queryByTestId('media-list'));
  };

  describe('EditImageStep', () => {
    describe('Filter Tab', () => {
      test('Should display the selected image and the filter selection list', async () => {
        await renderImagePickerToEditImageStep();
        expect(screen.queryByTestId('image-picker-media-image')).toBeTruthy();
        expect(screen.queryByTestId('filter-selection-list')).toBeTruthy();
      });

      test('Should apply the selected filter to the image', async () => {
        await renderImagePickerToEditImageStep();
        const filterSelectionList = screen.getByTestId('filter-selection-list');
        act(() => {
          fireEvent(filterSelectionList, 'change', 'corail');
        });

        expect(screen.getByTestId('image-picker-media-image')).toHaveProp(
          'layers',
          [
            expect.objectContaining({
              filters: ['corail'],
            }),
          ],
        );
      });
    });

    describe('Adjust Tab', () => {
      test('Should display a list of edition parameters when user select the adjust tab', async () => {
        await renderImagePickerToEditImageStep();
        act(() => {
          fireEvent.press(screen.getByLabelText('Adjust'));
        });
        expect('image-parameters-selection-list').toBeTruthy();
      });

      const renderToEditionParameterControl = async (
        param = 'brightness',
        applyChange?: number,
      ) => {
        await renderImagePickerToEditImageStep();
        act(() => {
          fireEvent.press(screen.getByLabelText('Adjust'));
        });
        const imageParametersSelectionList = screen.getByTestId(
          'image-parameters-selection-list',
        );
        act(() => {
          fireEvent(imageParametersSelectionList, 'selectParam', param);
        });

        if (typeof applyChange === 'number') {
          act(() => {
            fireEvent(
              screen.getByTestId('image-edition-parameter-control'),
              'change',
              0.5,
            );
          });
        }
      };

      test('Should display edition mode when user select a parameter', async () => {
        await renderToEditionParameterControl();
        expect(
          screen.queryByTestId('image-edition-parameter-control'),
        ).toBeTruthy();
      });

      test('Should apply the selected parameter change to the image', async () => {
        await renderToEditionParameterControl('brightness', 0.5);

        expect(screen.getByTestId('image-picker-media-image')).toHaveProp(
          'layers',
          [
            expect.objectContaining({
              parameters: expect.objectContaining({ brightness: 0.5 }),
            }),
          ],
        );
      });

      test('Should revert the change when the user cancel them', async () => {
        await renderToEditionParameterControl('brightness', 0.5);
        act(() => {
          fireEvent.press(screen.getByText('Cancel').parent!);
        });
        expect(screen.getByTestId('image-picker-media-image')).not.toHaveProp(
          'editionParameters',
          expect.objectContaining({
            brightness: 0.5,
          }),
        );
        expect(
          screen.queryByTestId('image-edition-parameter-control'),
        ).not.toBeTruthy();
      });

      test('Should validate the change when the user validate them', async () => {
        await renderToEditionParameterControl('brightness', 0.5);
        act(() => {
          fireEvent.press(screen.getByText('Validate').parent!);
        });
        expect(screen.getByTestId('image-picker-media-image')).toHaveProp(
          'layers',
          [
            expect.objectContaining({
              parameters: expect.objectContaining({ brightness: 0.5 }),
            }),
          ],
        );
        expect(
          screen.queryByTestId('image-edition-parameter-control'),
        ).not.toBeTruthy();
      });

      test('Should enter crop mode if the user select the crop parameter', async () => {
        await renderToEditionParameterControl('cropData');
        expect(screen.queryByTestId('cropper')).toHaveProp(
          'cropEditionMode',
          true,
        );

        act(() => {
          fireEvent(
            screen.getByTestId('image-edition-parameter-control'),
            'change',
            0.5,
          );
        });
        const getMedia = () => screen.getByTestId('image-picker-media-image');
        expect(getMedia()).toHaveProp('layers', [
          expect.objectContaining({
            parameters: expect.objectContaining({ roll: 0.5 }),
          }),
        ]);

        act(() => {
          fireEvent(getMedia(), 'onCropDataChange', {
            x: 100,
            y: 100,
            width: 500,
            height: 800,
          });
        });

        expect(getMedia()).toHaveProp('layers', [
          expect.objectContaining({
            parameters: expect.objectContaining({
              roll: 0.5,
              cropData: { x: 100, y: 100, width: 500, height: 800 },
            }),
          }),
        ]);

        act(() => {
          fireEvent.press(screen.getByLabelText('Rotate'));
        });
        expect(getMedia()).toHaveProp('layers', [
          expect.objectContaining({
            parameters: expect.objectContaining({
              roll: 0.5,
              cropData: { x: 100, y: 100, width: 500, height: 800 },
              orientation: 'RIGHT',
            }),
          }),
        ]);

        expect(getMedia()).toHaveProp('layers', [
          expect.objectContaining({
            parameters: expect.objectContaining({
              roll: 0.5,
              cropData: { x: 100, y: 100, width: 500, height: 800 },
              orientation: 'RIGHT',
            }),
          }),
        ]);

        act(() => {
          fireEvent.press(screen.getByText('Cancel').parent!);
        });
        expect(screen.getByTestId('cropper')).toHaveProp(
          'cropEditionMode',
          false,
        );
        expect(getMedia()).toHaveProp('layers', [
          expect.objectContaining({
            parameters: {},
          }),
        ]);
      });
    });

    describe('Cut Video Tab', () => {
      test('Should display the video cut tab, only if the selected media is a video', async () => {
        await renderImagePickerToEditImageStep(undefined, 'image');
        expect(screen.queryByLabelText('Cut Video')).not.toBeTruthy();

        await renderImagePickerToEditImageStep(undefined, 'video');
        expect(screen.queryByLabelText('Cut Video')).toBeTruthy();
      });

      test('Should set the video time range when the user edit the video', async () => {
        await renderImagePickerToEditImageStep(
          { maxVideoDuration: 11 },
          'video',
        );
        act(() => {
          fireEvent.press(screen.getByLabelText('Cut Video'));
        });
        const videoCutControl = screen.getByTestId('video-time-line-editor');
        act(() => {
          fireEvent(videoCutControl, 'change', {
            startTime: 3.4,
            duration: 12.6,
          });
        });
        const video = screen.getByTestId('image-picker-media-video');
        expect(video).toHaveProp('layers', [
          expect.objectContaining({ startTime: 3.4, duration: 11 }),
        ]);
      });
    });
  });

  test('Should dispatch on finish after the last step', async () => {
    const onFinished = jest.fn();
    await renderImagePickerToEditImageStep({ onFinished });

    const filterSelectionList = screen.getByTestId('filter-selection-list');
    act(() => {
      fireEvent(filterSelectionList, 'change', 'blackAndWhite');
    });

    act(() => {
      fireEvent.press(screen.getByLabelText('Adjust'));
    });
    const imageParametersSelectionList = screen.getByTestId(
      'image-parameters-selection-list',
    );
    act(() => {
      fireEvent(imageParametersSelectionList, 'selectParam', 'contrast');
    });

    act(() => {
      fireEvent(
        screen.getByTestId('image-edition-parameter-control'),
        'change',
        40,
      );
    });

    act(() => {
      fireEvent.press(screen.getByText('Validate').parent!);
    });

    act(() => {
      fireEvent.press(screen.getByText('Save').parent!);
    });

    expect(onFinished).toHaveBeenCalledWith({
      kind: 'image',
      uri: 'file://fakeuri.com/image2.jpg',
      width: 300,
      height: 500,
      filter: 'blackAndWhite',
      editionParameters: {
        contrast: 40,
      },
      aspectRatio: 300 / 500,
      timeRange: null,
    });
  });
});
