import { requireNativeComponent } from 'react-native';

/**
 * A native component that allows to display a video, it's a low level component
 * that is used by the MediaVideoRenderer.
 */
const NativeMediaVideoRenderer: React.ComponentType<any> =
  requireNativeComponent('AZPMediaVideoRenderer');

export default NativeMediaVideoRenderer;
