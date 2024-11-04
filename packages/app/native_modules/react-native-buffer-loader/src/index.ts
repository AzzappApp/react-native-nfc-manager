import { NativeModules, Platform } from 'react-native';

export type BufferLoader = {
  loadImage: (
    uri: string,
    maximumSize: { width: number; height: number } | null | undefined,
    callback: (error: any, buffer: bigint | null) => void,
  ) => void;
  loadVideoFrame: (
    uri: string,
    time: number,
    maximumSize: { width: number; height: number } | null | undefined,
    callback: (error: any, buffer: bigint | null) => void,
  ) => void;
  unrefBuffer(buffer: bigint): void;
};

//@ts-expect-error __turboModuleProxy is not defined in react-native
const isTurboModuleEnabled = global.__turboModuleProxy != null;

const ReactNativeBufferLoaderModule = isTurboModuleEnabled
  ? require('./NativeAzzappRNBufferLoader').default
  : NativeModules.AzzappRNBufferLoader;

if (!ReactNativeBufferLoaderModule) {
  throw new Error(
    `The package '@azzapp/react-native-buffer-loader' doesn't seem to be linked. Make sure: \n\n` +
      Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
      '- You rebuilt the app after installing the package\n' +
      '- You are not using Expo Go\n',
  );
}

ReactNativeBufferLoaderModule.install();

const BufferLoaderModule = (global as any)
  .Azzapp_RNBufferLoader as BufferLoader;

export default BufferLoaderModule;
