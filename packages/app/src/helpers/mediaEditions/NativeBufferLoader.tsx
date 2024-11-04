import { Skia } from '@shopify/react-native-skia';
import { Platform } from 'react-native';
import { runOnUI } from 'react-native-reanimated';
import BufferLoader from '@azzapp/react-native-buffer-loader';
import type { SkImage } from '@shopify/react-native-skia';

// would be cool to have weak ref and finalization registry here to clean up images
// we will do it manually for now waiting for react-native 0.75

const isAndroid = Platform.OS === 'android';
const loadImageTasks = new Map<string, Promise<bigint>>();
const buffers = new Map<string, { buffer: bigint; refCount: number }>();

let cleanupTimeout: any = null;
const scheduleCleanUp = () => {
  clearTimeout(cleanupTimeout);
  cleanupTimeout = setTimeout(() => {
    for (const [key, ref] of buffers) {
      if (ref.refCount <= 0) {
        buffers.delete(key);
        BufferLoader.unrefBuffer(ref.buffer);
      }
    }
    if (isAndroid) {
      return;
    }
    const activeBuffers = [...buffers.values()].map(({ buffer }) => buffer);
    runOnUI(() => {
      'worklet';
      const bufferImageCache: Map<bigint, SkImage | null> =
        ((global as any).____bufferImageCache as any) ?? null;
      if (!bufferImageCache) {
        return;
      }
      for (const [buffer, image] of bufferImageCache.entries()) {
        if (!activeBuffers.includes(buffer)) {
          try {
            image?.dispose();
          } catch (e) {
            console.warn('Error disposing image', e);
          }
          bufferImageCache.delete(buffer);
        }
      }
    })();
  }, 1000);
};

type ImageLoader = (
  callback: (error: any, buffer: bigint | null) => void,
) => void;

const loadImageWithCache = async (
  key: string,
  loader: ImageLoader,
): Promise<bigint> => {
  if (buffers.has(key)) {
    const ref = buffers.get(key)!;
    return ref.buffer;
  }
  if (!loadImageTasks.has(key)) {
    loadImageTasks.set(
      key,
      new Promise((resolve, reject) => {
        loader((error, buffer) => {
          if (error) {
            reject(new Error(error));
          }
          loadImageTasks.delete(key);
          if (!buffer) {
            reject(new Error('Failed to create image from buffer'));
            return;
          }
          buffers.set(key, {
            buffer,
            refCount: 0,
          });
          scheduleCleanUp();
          resolve(buffer);
        });
      }),
    );
  }
  return loadImageTasks.get(key)!;
};

const loadImage = (
  uri: string,
  maximumSize?: { width: number; height: number } | null,
): { key: string; promise: Promise<bigint> } => {
  const key = [
    uri,
    maximumSize ? `${maximumSize.width}-${maximumSize.height}` : 'full',
  ].join('-');
  return {
    key,
    promise: loadImageWithCache(key, callback =>
      BufferLoader.loadImage(uri, maximumSize, callback),
    ),
  };
};

const loadVideoThumbnail = (
  uri: string,
  time = 0,
  maximumSize?: { width: number; height: number } | null,
): { key: string; promise: Promise<bigint> } => {
  const key = [
    uri,
    time,
    maximumSize ? `${maximumSize.width}-${maximumSize.height}` : 'full',
  ].join('-');
  return {
    key,
    promise: loadImageWithCache(key, callback =>
      BufferLoader.loadVideoFrame(uri, time, maximumSize, callback),
    ),
  };
};

const ref = (key: string) => {
  const ref = buffers.get(key);
  if (ref) {
    ref.refCount++;
  }
  scheduleCleanUp();
};

const unref = (key: string) => {
  const ref = buffers.get(key);
  if (ref && ref.refCount > 0) {
    ref.refCount--;
  }
  scheduleCleanUp();
};

const NativeBufferLoader = {
  loadImage,
  loadVideoThumbnail,
  ref,
  unref,
};

export default NativeBufferLoader;

const createImageFromNativeBufferInner = (
  buffer: bigint | null | undefined,
): SkImage | null => {
  'worklet';
  if (buffer == null) {
    return null;
  }
  let image: SkImage | null = null;
  try {
    image = Skia.Image.MakeImageFromNativeBuffer(buffer);
  } catch (e) {
    console.warn('Error creating image from native buffer', e);
    return null;
  }
  return image;
};

/**
 * Converts a native buffer to a SkImage
 * @param buffer the native buffer
 * @param fromBufferLoader if the buffer was loaded from the NativeBufferLoader (it will induce a cache)
 * @returns the SkImage or null if the buffer is null or the image could not be created
 */
export const createImageFromNativeBuffer = (
  buffer: bigint | null | undefined,
  fromBufferLoader: boolean,
): SkImage | null => {
  'worklet';
  if (!fromBufferLoader || isAndroid) {
    return createImageFromNativeBufferInner(buffer);
  }
  if (buffer == null) {
    return null;
  }
  const globalAny = global as any;
  if (!globalAny.____bufferImageCache) {
    globalAny.____bufferImageCache = new Map();
  }
  const bufferImageCache: Map<bigint, SkImage | null> =
    globalAny.____bufferImageCache as any;

  if (bufferImageCache.has(buffer)) {
    return bufferImageCache.get(buffer) ?? null;
  }
  const image: SkImage | null = createImageFromNativeBufferInner(buffer);
  if (image) {
    bufferImageCache.set(buffer, image);
  }
  return image ?? null;
};
