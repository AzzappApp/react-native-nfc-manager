import {
  Skia,
  createPicture,
  drawAsImageFromPicture,
} from '@shopify/react-native-skia';
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
    callback: (error: any, buffer: bigint | null) => void,
  ) => void;
  unrefBuffer(buffer: bigint): void;
};

const getBufferLoader = () => getJSIModule('BufferLoader') as BufferLoader;

// would be cool to have weak ref and finalization registry here to clean up images
// we will do it manually for now waiting for react-native 0.75

const loadImageTasks = new Map<string, Promise<SkImage>>();
const skImages = new Map<
  string,
  { image: SkImage; buffer: bigint; refCount: number }
>();

type ImageLoader = (
  callback: (error: any, buffer: bigint | null) => void,
) => void;

const loadImageWithCache = async (
  key: string,
  loader: ImageLoader,
): Promise<SkImage> => {
  if (skImages.has(key)) {
    const ref = skImages.get(key)!;
    ref.refCount++;
    return ref.image;
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
          let image: SkImage | null =
            Skia.Image.MakeImageFromNativeBuffer(buffer);
          image = image
            ? drawAsImageFromPicture(
                createPicture(canvas => canvas.drawImage(image!, 0, 0)),
                {
                  width: image.width(),
                  height: image.height(),
                },
              )
            : null;
          if (!image) {
            reject(new Error('Failed to create image from buffer'));
            return;
          }
          skImages.set(key, {
            image,
            buffer,
            refCount: 0,
          });
          setTimeout(() => {
            // in case of orphaned task we will clean up the image
            if (skImages.has(key) && skImages.get(key)!.refCount === 0) {
              skImages.delete(key);
              getBufferLoader().unrefBuffer(buffer);
            }
          }, 1000);
          resolve(image);
        });
      }),
    );
  }
  return loadImageTasks.get(key)!;
};

const loadImage = (uri: string): Promise<SkImage> => {
  return loadImageWithCache(uri, callback =>
    getBufferLoader().loadImage(uri, callback),
  );
};

const loadVideoThumbnail = (uri: string, time = 0): Promise<SkImage> => {
  return loadImageWithCache(`${uri}-${time}`, callback =>
    getBufferLoader().loadVideoFrame(uri, time, callback),
  );
};

const refImage = (uri: string) => {
  const ref = skImages.get(uri);
  if (ref) {
    ref.refCount++;
  }
  // logCacheInfo();
};

const unrefImage = (uri: string) => {
  const ref = skImages.get(uri);
  if (ref) {
    ref.refCount--;
    if (ref.refCount === 0) {
      skImages.delete(uri);
      getBufferLoader().unrefBuffer(ref.buffer);
    }
  }
  // logCacheInfo();
};

// const logCacheInfo = () => {
//   skImages.forEach((value, key) => {
//     console.log(key, value.refCount);
//   });
// };

const SKImageLoader = {
  loadImage,
  loadVideoThumbnail,
  refImage,
  unrefImage,
};

export default SKImageLoader;
