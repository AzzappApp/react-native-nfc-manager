#import "BufferLoader.h"
#import <CoreImage/CoreImage.h>

namespace azzapp {

BufferLoaderHostObject::BufferLoaderHostObject(std::shared_ptr<react::CallInvoker> callInvoker)
  : callInvoker(callInvoker) {
  metalDevice = MTLCreateSystemDefaultDevice();
  if (!metalDevice) {
    throw std::runtime_error("Failed to create MTLDevice");
  }
  commandQueue = [metalDevice newCommandQueue];
  colorSpace = CGColorSpaceCreateDeviceRGB();
  ciContext = [CIContext contextWithMTLDevice:metalDevice];
}

BufferLoaderHostObject::~BufferLoaderHostObject() {
  colorSpace = nil;
  ciContext = nil;
  commandQueue = nil;
  metalDevice = nil;
}


std::vector<jsi::PropNameID> BufferLoaderHostObject::getPropertyNames(jsi::Runtime& rt) {
    std::vector<jsi::PropNameID> result;
    result.push_back(jsi::PropNameID::forUtf8(rt, std::string("loadImage")));
    result.push_back(jsi::PropNameID::forUtf8(rt, std::string("loadVideoFrame")));
    result.push_back(jsi::PropNameID::forUtf8(rt, std::string("unrefTexture")));
    return result;
}


jsi::Value BufferLoaderHostObject::get(jsi::Runtime &runtime, const jsi::PropNameID &name) {
  auto propName = name.utf8(runtime);

 if (propName == "loadImage") {
  return jsi::Function::createFromHostFunction(
    runtime, jsi::PropNameID::forAscii(runtime, "loadImage"), 3,
      [this](jsi::Runtime &runtime, const jsi::Value &thisValue,
             const jsi::Value *arguments, size_t count) -> jsi::Value {
        NSString *url = [NSString stringWithUTF8String:arguments[0]
                                                     .asString(runtime)
                                                     .utf8(runtime)
                                                     .c_str()];
        CGSize maxSize = CGSizeZero;
        if (arguments[1].isObject()) {
          auto size = arguments[1].asObject(runtime);
          maxSize.width = size.getProperty(runtime, "width").asNumber();
          maxSize.height = size.getProperty(runtime, "height").asNumber();
        }
        auto callback = std::make_shared<jsi::Function>(arguments[2].asObject(runtime).asFunction(runtime));

        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
          loadTexture(callback, runtime, [&]() -> id<MTLTexture> {
            NSURL *imageURL = [NSURL URLWithString:url];
            if (!imageURL) throw std::runtime_error("Invalid image URL");

            CIImage *ciImage = [[CIImage alloc] initWithContentsOfURL:imageURL options:@{
              kCIImageApplyOrientationProperty: @YES
            }];
            if (!ciImage) throw std::runtime_error("Failed to load image");

            return createMTLTextureFromCIImage(ciImage, maxSize);
          });
        });

        return jsi::Value::undefined();
      });
  }

  
  if (propName == "loadVideoFrame") {
    return jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "loadVideoFrame"), 4,
      [this](jsi::Runtime &runtime, const jsi::Value &thisValue,
             const jsi::Value *arguments, size_t count) -> jsi::Value {
        NSString *url = [NSString stringWithUTF8String:arguments[0]
                                                     .asString(runtime)
                                                     .utf8(runtime)
                                                     .c_str()];
        double time = arguments[1].asNumber();
        CGSize maxSize = CGSizeZero;
        if (arguments[2].isObject()) {
          auto size = arguments[2].asObject(runtime);
          maxSize.width = size.getProperty(runtime, "width").asNumber();
          maxSize.height = size.getProperty(runtime, "height").asNumber();
        }
        auto callback = std::make_shared<jsi::Function>(arguments[3].asObject(runtime).asFunction(runtime));

        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
          loadTexture(callback, runtime, [&]() -> id<MTLTexture> {
            NSURL *videoURL = [NSURL URLWithString:url];
            if (!videoURL) throw std::runtime_error("Invalid video URL");

            AVAsset *asset = [AVAsset assetWithURL:videoURL];
            AVAssetImageGenerator *generator = [[AVAssetImageGenerator alloc] initWithAsset:asset];
            generator.appliesPreferredTrackTransform = YES;

            if (!CGSizeEqualToSize(maxSize, CGSizeZero)) {
              generator.maximumSize = maxSize;
            }

            NSError *error = nil;
            CGImageRef cgImage = [generator copyCGImageAtTime:CMTimeMakeWithSeconds(time, 600)
                                                 actualTime:nil
                                                      error:&error];
            if (error || !cgImage) throw std::runtime_error("Failed to generate video frame");

            CIImage *ciImage = [CIImage imageWithCGImage:cgImage];
            id<MTLTexture> texture = createMTLTextureFromCIImage(ciImage, maxSize);
            CGImageRelease(cgImage);

            return texture;
          });
        });

        return jsi::Value::undefined();
      });
  }

  if (propName == "unrefTexture") {
    return jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "unrefTexture"), 1,
      [this](jsi::Runtime &runtime, const jsi::Value &thisValue,
             const jsi::Value *arguments, size_t count) -> jsi::Value {
        try {
          uint64_t textureKey = arguments[0].asObject(runtime)
            .getProperty(runtime, "mtlTexture")
            .asBigInt(runtime).asUint64(runtime);
          auto it = textureCache.find(textureKey);
          if (it != textureCache.end()) {
            id<MTLTexture> texture = it->second;
            [texture setPurgeableState:MTLPurgeableStateEmpty];
            textureCache.erase(it);
          }
        } catch (...) {
          NSLog(@"BufferLoaderHostObject: unrefTexture failed to release");
        }
        return jsi::Value::undefined();
      });
  }

  return jsi::Value::undefined();
}

id<MTLTexture> BufferLoaderHostObject::createMTLTextureFromCIImage(CIImage *image, CGSize maxSize) {
  if (!CGSizeEqualToSize(maxSize, CGSizeZero)) {
    CGFloat aspectRatio = image.extent.size.width / image.extent.size.height;
    if (aspectRatio > 1) {
      image = [image imageByApplyingTransform:CGAffineTransformMakeScale(
        maxSize.width / image.extent.size.width,
        maxSize.width / image.extent.size.width)];
    } else {
      image = [image imageByApplyingTransform:CGAffineTransformMakeScale(
        maxSize.height / image.extent.size.height,
        maxSize.height / image.extent.size.height)];
    }
  }

  CGSize imageSize = image.extent.size;

  MTLTextureDescriptor *descriptor = [[MTLTextureDescriptor alloc] init];
  descriptor.pixelFormat = MTLPixelFormatBGRA8Unorm;
  descriptor.width = imageSize.width;
  descriptor.height = imageSize.height;
  descriptor.usage = MTLTextureUsageShaderRead | MTLTextureUsageShaderWrite;
  descriptor.storageMode = MTLStorageModePrivate;

  id<MTLTexture> texture = [metalDevice newTextureWithDescriptor:descriptor];
  if (!texture) {
    throw std::runtime_error("Failed to create Metal texture");
  }

  CGAffineTransform transform = CGAffineTransformMakeTranslation(0, imageSize.height);
  transform = CGAffineTransformScale(transform, 1.0, -1.0);
  CIImage *flippedImage = [image imageByApplyingTransform:transform];

  [ciContext render:flippedImage toMTLTexture:texture commandBuffer:nil bounds:image.extent colorSpace:colorSpace];

  return texture;
}

void BufferLoaderHostObject::loadTexture(
  std::shared_ptr<jsi::Function> callback, jsi::Runtime &runtime,
  const std::function<id<MTLTexture>  _Nonnull ()> &textureCreator) {
  bool hasError = false;
  std::string error =" Failed to load texture";
  try {
    // Crée la texture à partir de la fonction passée
    id<MTLTexture> texture = textureCreator();
    if (!texture) throw std::runtime_error("Failed to create texture");

    // Ajoute la texture au cache
    CGSize size = CGSizeMake(texture.width, texture.height);
    uint64_t textureKey = reinterpret_cast<uint64_t>(texture);
    textureCache[textureKey] = texture;

    // Invoque le callback avec les informations de texture
    callInvoker->invokeAsync([&runtime, callback, textureKey, size]() {
      jsi::Object texInfo = jsi::Object(runtime);
      texInfo.setProperty(runtime, "mtlTexture", jsi::BigInt::fromUint64(runtime, textureKey));
      callback->call(runtime, jsi::Value::null(), texInfo, size.width, size.height);
    });
  } catch (const std::exception &e) {
    hasError = true;
    error = e.what();
  } catch(...) {
    hasError = true;
  }
  if (hasError) {
    callInvoker->invokeAsync([&runtime, callback, error]() {
      callback->call(runtime, jsi::String::createFromUtf8(runtime, error));
    });
  }
}


} // namespace azzapp
