import { createElement } from 'react';
import type { CameraProps } from 'react-native-vision-camera';

export const Camera = jest.fn(function Camera(props: CameraProps) {
  return createElement('Camera', props);
});

Object.assign(Camera, {
  getCameraPermissionStatus: jest.fn(),
  getMicrophonePermissionStatus: jest.fn(),
  requestCameraPermission: jest.fn(),
  requestMicrophonePermission: jest.fn(),
});

export const useCameraDevices = jest.fn(() => {
  return {
    availableDevices: [],
    defaultDevice: null,
    activeDevice: null,
    setActiveDevice: jest.fn(),
  };
});
