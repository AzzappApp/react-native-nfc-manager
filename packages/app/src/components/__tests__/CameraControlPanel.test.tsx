import CameraControlPanel from '#components/CameraControlPanel';
import { fireEvent, render, screen } from '#helpers/testHelpers';

jest.mock('expo-file-system/next', () => ({
  Paths: {
    cache: {
      uri: 'file://temp',
    },
  },
}));

describe('CameraControlPanel', () => {
  test('Should render a shutter button in photo mode', () => {
    const onTakePhoto = jest.fn();
    render(
      <CameraControlPanel
        ready
        captureMode="photo"
        maxVideoDuration={10}
        onTakePhoto={onTakePhoto}
        onStartRecording={jest.fn()}
        onStopRecording={jest.fn()}
      />,
    );
    const shutter = screen.getByRole('button');
    expect(onTakePhoto).not.toHaveBeenCalled();
    fireEvent.press(shutter);
    expect(onTakePhoto).toHaveBeenCalled();
  });

  test('Should render recording buttons in video mode', () => {
    const onStartRecording = jest.fn();
    const onStopRecording = jest.fn();
    render(
      <CameraControlPanel
        ready
        captureMode="video"
        maxVideoDuration={10}
        onTakePhoto={jest.fn()}
        onStartRecording={onStartRecording}
        onStopRecording={onStopRecording}
      />,
    );
    const button = screen.getByRole('button');
    expect(onStartRecording).not.toHaveBeenCalled();
    expect(button).toHaveProp('accessibilityHint', 'Tap to start recording');
    fireEvent.press(button);
    expect(button).toHaveProp('accessibilityHint', 'Tap to stop recording');
    expect(onStartRecording).toHaveBeenCalled();
    expect(onStopRecording).not.toHaveBeenCalled();
    fireEvent.press(button);
    expect(onStopRecording).toHaveBeenCalled();
    expect(button).toHaveProp('accessibilityHint', 'Tap to start recording');
  });

  test('Should not allow to take a picture or video when the camera is not ready', () => {
    const onTakePhoto = jest.fn();
    render(
      <CameraControlPanel
        ready={false}
        captureMode="photo"
        maxVideoDuration={10}
        onTakePhoto={onTakePhoto}
        onStartRecording={jest.fn()}
        onStopRecording={jest.fn()}
      />,
    );
    const shutterButton = screen.getByRole('button');
    expect(shutterButton).toHaveAccessibilityState({ disabled: true });
    expect(onTakePhoto).not.toHaveBeenCalled();
    fireEvent.press(shutterButton);
    expect(onTakePhoto).not.toHaveBeenCalled();

    render(
      <CameraControlPanel
        ready={false}
        captureMode="video"
        maxVideoDuration={10}
        onTakePhoto={onTakePhoto}
        onStartRecording={jest.fn()}
        onStopRecording={jest.fn()}
      />,
    );
    const recordButton = screen.getByRole('button');
    expect(recordButton).toHaveAccessibilityState({ disabled: true });
    expect(onTakePhoto).not.toHaveBeenCalled();
    fireEvent.press(recordButton);
    expect(onTakePhoto).not.toHaveBeenCalled();
  });
});
