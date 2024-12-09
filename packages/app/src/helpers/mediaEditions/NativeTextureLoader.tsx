import { Skia } from '@shopify/react-native-skia';
import pick from 'lodash/pick';
import BufferLoader from '@azzapp/react-native-buffer-loader';
import type { SkImage } from '@shopify/react-native-skia';

// would be cool to have weak ref and finalization registry here to clean up images
// we will do it manually for now waiting for react-native 0.75

export type TextureInfo = {
  texture: unknown;
  width: number;
  height: number;
};

const loadImageTasks = new Map<
  string,
  Promise<{ texture: unknown; width: number; height: number }>
>();
const textures = new Map<
  string,
  { texture: unknown; width: number; height: number; refCount: number }
>();

let cleanupTimeout: any = null;
const scheduleCleanUp = () => {
  clearTimeout(cleanupTimeout);
  cleanupTimeout = setTimeout(() => {
    for (const [key, ref] of textures) {
      if (ref.refCount <= 0) {
        textures.delete(key);
        BufferLoader.unrefTexture(ref.texture);
      }
    }
  }, 1000);
};

type ImageLoader = (
  callback: (
    error: any,
    texture: unknown,
    width: number,
    height: number,
  ) => void,
) => void;

const loadImageWithCache = async (
  key: string,
  loader: ImageLoader,
): Promise<TextureInfo> => {
  if (textures.has(key)) {
    const ref = textures.get(key)!;
    return pick(ref, ['texture', 'width', 'height']);
  }
  if (!loadImageTasks.has(key)) {
    loadImageTasks.set(
      key,
      new Promise((resolve, reject) => {
        loader((error, texture, width, height) => {
          if (error) {
            reject(new Error(error));
          }
          loadImageTasks.delete(key);
          if (!texture) {
            reject(new Error('Failed to load texture'));
            return;
          }
          textures.set(key, {
            texture,
            refCount: 0,
            width,
            height,
          });
          scheduleCleanUp();
          resolve({
            texture,
            width,
            height,
          });
        });
      }),
    );
  }
  return loadImageTasks.get(key)!;
};

const loadImage = (
  uri: string,
  maximumSize?: { width: number; height: number } | null,
): {
  key: string;
  promise: Promise<TextureInfo>;
} => {
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
): {
  key: string;
  promise: Promise<TextureInfo>;
} => {
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
  const ref = textures.get(key);
  if (ref) {
    ref.refCount++;
  }
  scheduleCleanUp();
};

const unref = (key: string) => {
  const ref = textures.get(key);
  if (ref && ref.refCount > 0) {
    ref.refCount--;
  }
  scheduleCleanUp();
};

const NativeTextureLoader = {
  loadImage,
  loadVideoThumbnail,
  ref,
  unref,
};

export default NativeTextureLoader;

/**
 * Converts a native buffer to a SkImage
 * @param texture the native buffer
 * @returns the SkImage or null if the buffer is null or the image could not be created
 */
export const createImageFromNativeTexture = (
  textureInfo: TextureInfo | null,
): SkImage | null => {
  'worklet';
  if (textureInfo == null) {
    return null;
  }
  const { texture, width, height } = textureInfo;
  if (!texture) {
    return null;
  }
  let image: SkImage | null = null;
  try {
    image = Skia.Image.MakeImageFromNativeTextureUnstable(
      texture,
      width,
      height,
    );
  } catch (e) {
    console.warn('Error creating image from native texture', e);
    return null;
  }
  return image ?? null;
};
