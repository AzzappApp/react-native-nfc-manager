import { requireNativeComponent } from 'react-native';

/**
 * A native component that allows to display an image, it's a low level component
 * that is used by the MediaImageRenderer.
 */
const NativeMediaImageRenderer: React.ComponentType<any> =
  requireNativeComponent('AZPMediaImageRenderer');

export default NativeMediaImageRenderer;
