import {
  Skia,
  createPicture,
  drawAsImageFromPicture,
} from '@shopify/react-native-skia';
import { Platform } from 'react-native';
import { getJSIModule } from '#helpers/azzappJSIModules';
import type { SkImage } from '@shopify/react-native-skia';

type BufferLoader = {
  loadImage: (
    uri: string,
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

const getBufferLoader = () => getJSIModule('BufferLoader') as BufferLoader;

// would be cool to have weak ref and finalization registry here to clean up images
// we will do it manually for now waiting for react-native 0.75

const loadImageTasks = new Map<string, Promise<bigint>>();
const buffers = new Map<string, { buffer: bigint; refCount: number }>();

let cleanupTimeout: any = null;
const scheduleCleanUp = () => {
  clearTimeout(cleanupTimeout);
  cleanupTimeout = setTimeout(() => {
    for (const [key, ref] of buffers) {
      if (ref.refCount <= 0) {
        buffers.delete(key);
        getBufferLoader().unrefBuffer(ref.buffer);
      }
    }
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

const loadImage = (uri: string): Promise<bigint> => {
  return loadImageWithCache(uri, callback =>
    getBufferLoader().loadImage(uri, callback),
  );
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
      getBufferLoader().loadVideoFrame(uri, time, maximumSize, callback),
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

const isAndroid = Platform.OS === 'android';
export const createImageFromNativeBuffer = (
  buffer: bigint | null | undefined,
) => {
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
  if (isAndroid) {
    // copying the image to avoid issues with the original buffer
    if (typeof _WORKLET === 'undefined' || _WORKLET === false) {
      console.warn('createImageFromNativeBuffer should be called in worklet');
    }
    if (image) {
      image = drawAsImageFromPicture(
        createPicture(canvas => canvas.drawImage(image!, 0, 0), {
          width: image.width(),
          height: image.height(),
        }),
        {
          width: image.width(),
          height: image.height(),
        },
      );
    }
  }
  return image;
};
