import { createRef } from 'react';
import { AppState } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraDevices,
} from 'react-native-vision-camera';
import { flushPromises } from '@azzapp/shared/jestHelpers';
import CameraView from '#components/CameraView';
import { act, fireEvent, render, screen } from '#helpers/testHelpers';
import type { CameraViewProps, CameraViewHandle } from '#components/CameraView';
import type { Ref } from 'react';
import type { AppStateStatus } from 'react-native';

const mockCameraRef = {
  takePhoto: jest
    .fn()
    .mockResolvedValue({ path: 'file:///example.com/photo.jpg' }),
  startRecording: jest.fn(),
  stopRecording: jest.fn(),
};

jest.mock('react-native-vision-camera', () => {
  const react = require('react');
  const CameraInner = (props: any, ref: any) => {
    react.useImperativeHandle(ref, () => mockCameraRef);
    return react.createElement('Camera', { ...props, testID: 'camera' });
  };
  const Camera = react.forwardRef(CameraInner);
  Camera.getMicrophonePermissionStatus = jest
    .fn()
    .mockResolvedValue('authorized');
  return {
    Camera,
    useCameraDevice: jest.fn(),
    useCameraDevices: jest.fn(),
    useCameraFormat: jest.fn(),
  };
});
const useCameraDevicesMock = useCameraDevices as jest.Mock;
const useCameraDeviceMock = useCameraDevice as jest.Mock;

describe('CameraView', () => {
  beforeEach(() => {
    AppState.currentState = 'active' as AppStateStatus;
  });
  afterEach(() => {
    useCameraDevicesMock.mockClear();
    useCameraDeviceMock.mockClear();
    mockCameraRef.takePhoto.mockClear();
  });

  const renderCameraView = async (
    props?: Partial<CameraViewProps & { ref: Ref<CameraViewHandle> }>,
    devices: any = [
      {
        id: 'back',
        hasFlash: true,
      },
      {
        id: 'front',
        hasFlash: true,
      },
    ],
  ) => {
    useCameraDevicesMock.mockReturnValue(devices);
    const res = render(
      <CameraView
        onInitialized={() => void 0}
        onError={() => void 0}
        {...props}
      />,
    );
    await act(flushPromises);
    return res;
  };

  test('Should render the camera with the back device', async () => {
    useCameraDeviceMock.mockReturnValue({
      id: 'back',
      hasFlash: true,
    });
    await renderCameraView();
    const camera = screen.getByTestId('camera');
    expect(camera).toHaveProp('device', { id: 'back', hasFlash: true });
  });

  test('Should call onInitialized when the camera is ready', async () => {
    const onInitialized = jest.fn();
    await renderCameraView({ onInitialized });
    const camera = screen.getByTestId('camera');
    fireEvent(camera, 'initialized');
    expect(onInitialized).toHaveBeenCalled();
  });

  test('Should call onError when the camera encounters an error', async () => {
    const onError = jest.fn();
    await renderCameraView({ onError });
    const camera = screen.getByTestId('camera');
    fireEvent(camera, 'error', { code: 'unknown' });
    expect(onError).toHaveBeenCalledWith({ code: 'unknown' });
  });

  test('Should allows the user to flip camera only if the camera supports it', async () => {
    await renderCameraView(undefined, [{ id: 'back' }]);

    useCameraDeviceMock.mockReturnValue({
      id: 'back',
      hasFlash: true,
    });

    expect(screen.queryByLabelText('Flip camera')).toBeNull();

    await renderCameraView(undefined, [
      { id: 'back', hasFlash: true },
      { id: 'front', hasFlash: true },
    ]);

    expect(useCameraDeviceMock).toHaveBeenCalledWith('back');

    expect(screen.queryByLabelText('Flip camera')).toBeTruthy();
    expect(screen.getByTestId('camera')).toHaveProp('device', {
      id: 'back',
      hasFlash: true,
    });

    useCameraDeviceMock.mockClear();
    useCameraDeviceMock.mockReturnValue({
      id: 'front',
      hasFlash: true,
    });

    act(() => {
      fireEvent.press(screen.getByLabelText('Flip camera'));
    });

    expect(useCameraDeviceMock).toHaveBeenCalledWith('front');

    expect(screen.getByTestId('camera')).toHaveProp('device', {
      id: 'front',
      hasFlash: true,
    });
  });

  test('Should allows the user to activate the torch only if the camera supports it', async () => {
    const ref = createRef<CameraViewHandle>();

    useCameraDeviceMock.mockReturnValue({
      id: 'front',
      hasFlash: true,
    });

    await renderCameraView({ ref }, [
      { id: 'back', hasFlash: true },
      { id: 'front', hasFlash: false },
    ]);

    const torchButton = screen.getByLabelText('Torch');
    expect(torchButton).toHaveAccessibilityValue({ text: 'Off' });
    void ref.current!.takePhoto();
    expect(mockCameraRef.takePhoto).toHaveBeenLastCalledWith(
      expect.objectContaining({ flash: 'off' }),
    );

    act(() => {
      fireEvent.press(torchButton);
    });
    expect(torchButton).toHaveAccessibilityValue({ text: 'On' });
    void ref.current!.takePhoto();
    expect(mockCameraRef.takePhoto).toHaveBeenLastCalledWith(
      expect.objectContaining({ flash: 'on' }),
    );

    act(() => {
      fireEvent.press(torchButton);
    });

    expect(torchButton).toHaveAccessibilityValue({ text: 'Auto' });
    void ref.current!.takePhoto();
    expect(mockCameraRef.takePhoto).toHaveBeenLastCalledWith(
      expect.objectContaining({ flash: 'auto' }),
    );

    useCameraDeviceMock.mockClear();
    useCameraDeviceMock.mockReturnValue({
      id: 'back',
      hasFlash: false,
    });

    act(() => {
      fireEvent.press(screen.getByLabelText('Flip camera'));
    });

    expect(screen.queryByLabelText('Torch')).not.toBeTruthy();
    void ref.current!.takePhoto();
    expect(mockCameraRef.takePhoto).toHaveBeenLastCalledWith(
      expect.objectContaining({ flash: 'off' }),
    );
  });

  test('Should deactivate the camera when the app is in the background', async () => {
    let listener: (appstatus: AppStateStatus) => void;
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementationOnce((event, callback) => {
        listener = callback;
        return {
          remove: jest.fn(),
        };
      });
    const ref = createRef<CameraViewHandle>();

    useCameraDeviceMock.mockReturnValue({
      id: 'back',
      hasFlash: true,
    });

    await renderCameraView({ ref });

    const camera = screen.getByTestId('camera');
    expect(camera).toHaveProp('isActive', true);
    void ref.current!.takePhoto();
    await flushPromises();
    expect(mockCameraRef.takePhoto).toHaveBeenCalledTimes(1);
    act(() => {
      listener('background');
    });
    expect(camera).toHaveProp('isActive', false);
    void ref.current!.takePhoto();
    await flushPromises();
    expect(mockCameraRef.takePhoto).toHaveBeenCalledTimes(1);
    act(() => {
      listener('active');
    });
    expect(camera).toHaveProp('isActive', true);
    void ref.current!.takePhoto();
    await flushPromises();
    expect(mockCameraRef.takePhoto).toHaveBeenCalledTimes(2);
  });

  test('Should deactivate audio if the user did not give the permission', async () => {
    useCameraDeviceMock.mockReturnValue({
      id: 'back',
      hasFlash: true,
    });
    (Camera.getMicrophonePermissionStatus as jest.Mock).mockReturnValue(
      'granted',
    );
    const { unmount } = await renderCameraView();
    expect(screen.getByTestId('camera')).toHaveProp('audio', true);
    unmount();

    (Camera.getMicrophonePermissionStatus as jest.Mock).mockReturnValue(
      'denied',
    );

    useCameraDeviceMock.mockReturnValue({
      id: 'back',
      hasFlash: true,
    });
    await renderCameraView();

    expect(screen.getByTestId('camera')).toHaveProp('audio', false);
  });

  test('Should take a photo and return the path of the picture', async () => {
    const ref = createRef<CameraViewHandle>();
    await renderCameraView({ ref });
    expect(await ref.current!.takePhoto()).toEqual(
      'file:///example.com/photo.jpg',
    );
  });

  test('record session behavior', async () => {
    expect.assertions(1);
    const ref = createRef<CameraViewHandle>();

    await renderCameraView({ ref });

    mockCameraRef.startRecording.mockResolvedValue({
      uri: 'file:///path/to/video.mp4',
    });
    const session = ref.current!.startRecording();
    await flushPromises();
    expect(mockCameraRef.startRecording).toHaveBeenCalled();

    void session?.then(path => {
      expect(path?.uri).toEqual('file:///path/to/video.mp4');
    });
  });

  test('renders the CameraView correctly with `initialCameraPosition` props to front', async () => {
    useCameraDeviceMock.mockReturnValue({
      id: 'front',
      hasFlash: true,
    });
    render(
      <CameraView
        initialCameraPosition="front"
        onInitialized={() => void 0}
        onError={() => void 0}
      />,
    );

    await act(flushPromises);

    expect(useCameraDeviceMock).toHaveBeenCalledWith('front');

    const camera = screen.getByTestId('camera');
    fireEvent(camera, 'initialized');
    expect(camera).toHaveProp('device', { id: 'front', hasFlash: true });
  });
  // TODO test focus behavior
});
