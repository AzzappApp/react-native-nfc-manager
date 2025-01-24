#import "BufferLoader.h"
#import <CoreImage/CoreImage.h>


namespace azzapp {


inline CGImageRef copyImage(CGImageRef image, CGSize imageSize, CGSize targetSize, CGAffineTransform transform) {
     
  CGContextRef context = CGBitmapContextCreate(NULL,
                                             targetSize.width,
                                             targetSize.height,
                                             8,
                                             0,
                                             CGColorSpaceCreateDeviceRGB(),
                                             kCGImageAlphaPremultipliedLast | kCGBitmapByteOrder32Big);
  
  if (!context) {
    return nil;
  }
  
  CGContextConcatCTM(context, transform);
  CGContextDrawImage(context, CGRectMake(0, 0, imageSize.width, imageSize.height), image);
  CGImageRef rotatedImage = CGBitmapContextCreateImage(context);
  CGContextRelease(context);
  
  return rotatedImage;
}


BufferLoaderHostObject::BufferLoaderHostObject(std::shared_ptr<react::CallInvoker> callInvoker)
  : callInvoker(callInvoker) {
  metalDevice = MTLCreateSystemDefaultDevice();
  if (!metalDevice) {
    throw std::runtime_error("Failed to create MTLDevice");
  }
  commandQueue = [metalDevice newCommandQueue];
  textureLoader = [[MTKTextureLoader alloc] initWithDevice:metalDevice];
}

BufferLoaderHostObject::~BufferLoaderHostObject() {
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
            CGImageRef cgImage = loadImageWithOrientation(imageURL, maxSize);
            if (!cgImage) throw std::runtime_error("Invalid image URL");
            
            NSError *error;
            auto texture = [textureLoader newTextureWithCGImage:cgImage options:@{
              MTKTextureLoaderOptionTextureStorageMode: @(MTLStorageModePrivate),
              MTKTextureLoaderOptionTextureUsage: @(MTLTextureUsageShaderRead | MTLTextureUsageShaderWrite)
            } error:&error];
            CGImageRelease(cgImage);
            if (error || !texture) {
              throw std::runtime_error("Failed to create texture");
            
            }
            return texture;
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
            
            CGSize imageSize = CGSizeMake(CGImageGetWidth(cgImage), CGImageGetHeight(cgImage));
            CGImageRef copy = copyImage(cgImage, imageSize, imageSize, CGAffineTransformIdentity);
            if (!copy) throw std::runtime_error("Failed to transform videoframe");
            CGImageRelease(cgImage);
            cgImage = copy;
            
  
            auto texture = [textureLoader newTextureWithCGImage:cgImage options:@{
              MTKTextureLoaderOptionTextureStorageMode: @(MTLStorageModePrivate),
              MTKTextureLoaderOptionTextureUsage: @(MTLTextureUsageShaderRead | MTLTextureUsageShaderWrite)
            } error:&error];
            CGImageRelease(cgImage);
            if (error || !texture) {
              throw std::runtime_error("Failed to create texture");
            
            }
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

void BufferLoaderHostObject::loadTexture(
  std::shared_ptr<jsi::Function> callback, jsi::Runtime &runtime,
  const std::function<id<MTLTexture>  _Nonnull ()> &textureCreator) {
  bool hasError = false;
  std::string error =" Failed to load texture";
  try {
    id<MTLTexture> texture = textureCreator();
    if (!texture) throw std::runtime_error("Failed to create texture");

    CGSize size = CGSizeMake(texture.width, texture.height);
    uint64_t textureKey = reinterpret_cast<uint64_t>(texture);
    textureCache[textureKey] = texture;

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

CGImageRef BufferLoaderHostObject::loadImageWithOrientation(NSURL *url, CGSize maxSize) {
  NSData *imageData = [NSData dataWithContentsOfURL:url];
  if (!imageData) {
    throw std::runtime_error("Failed to download image data");
  }

  // Creating the image source
  CFDictionaryRef options = (__bridge CFDictionaryRef)@{
    (NSString *)kCGImageSourceCreateThumbnailWithTransform: @YES,
    (NSString *)kCGImageSourceCreateThumbnailFromImageAlways: @YES,
    (NSString *)kCGImageSourceShouldCache: @YES
  };
  
  CGImageSourceRef imageSource = CGImageSourceCreateWithData((__bridge CFDataRef)imageData, options);
  if (!imageSource) {
    throw std::runtime_error("Failed to create image source");
  }
  
  // Retrieve image properties
  CFDictionaryRef imageProperties = CGImageSourceCopyPropertiesAtIndex(imageSource, 0, NULL);
  if (!imageProperties) {
    CFRelease(imageSource);
    throw std::runtime_error("Failed to get image properties");
  }
  
  // Retrieve the orientation
  NSInteger orientation = 1;
  CFNumberRef orientationProperty = (CFNumberRef)CFDictionaryGetValue(imageProperties, kCGImagePropertyOrientation);
  if (orientationProperty) {
    CFNumberGetValue(orientationProperty, kCFNumberNSIntegerType, &orientation);
  }
  
  // Create the original image
  CGImageRef originalImage = CGImageSourceCreateImageAtIndex(imageSource, 0, NULL);
  if (!originalImage) {
    CFRelease(imageProperties);
    CFRelease(imageSource);
    throw std::runtime_error("Failed to create image");
  }
  // Apply the orientation
  CGSize imageSize = CGSizeMake(CGImageGetWidth(originalImage), CGImageGetHeight(originalImage));
  CGAffineTransform transform = CGAffineTransformIdentity;
  BOOL swapWidthHeight = orientation >= 5;
  
  CGFloat scale = 1;
  if (!CGSizeEqualToSize(maxSize, CGSizeZero)) {
    CGFloat widthScale = maxSize.width / (swapWidthHeight ? imageSize.height : imageSize.width);
    CGFloat heightScale = maxSize.height / (swapWidthHeight ? imageSize.width : imageSize.height);
    scale = fmin(widthScale, heightScale);
  }
  
  switch (orientation) {
    case 2:
      // Horizontal flip
      transform = CGAffineTransformScale(transform, -1.0, 1.0);
      transform = CGAffineTransformTranslate(transform, -imageSize.width * scale, 0);
      break;
        
    case 3:
      // 180° rotation
      transform = CGAffineTransformRotate(transform, M_PI);
      transform = CGAffineTransformTranslate(transform, -imageSize.width * scale, -imageSize.height * scale);
      break;
        
    case 4:
      // Vertical flip
      transform = CGAffineTransformScale(transform, 1.0, -1.0);
      transform = CGAffineTransformTranslate(transform, 0, -imageSize.height * scale);
      break;
        
    case 5:
      // Horizontal flip + 90° rotation
      transform = CGAffineTransformScale(transform, -1.0, 1.0);
      transform = CGAffineTransformRotate(transform, -M_PI_2);
      break;
        
    case 6:
      // 90° rotation
      transform = CGAffineTransformRotate(transform, -M_PI_2);
      transform = CGAffineTransformTranslate(transform, -imageSize.width * scale, 0);
      break;
        
    case 7:
      // Horizontal flip + 270° rotation
      transform = CGAffineTransformScale(transform, -1.0, 1.0);
      transform = CGAffineTransformRotate(transform, M_PI_2);
      break;
        
    case 8:
      // 270° rotation
      transform = CGAffineTransformRotate(transform, M_PI_2);
      transform = CGAffineTransformTranslate(transform, 0, -imageSize.height * scale);
      break;
  }
  if (scale < 1) {
    transform = CGAffineTransformScale(transform, scale, scale);
  }
  CGImageRef result = copyImage(
    originalImage,
    imageSize,
    swapWidthHeight ?
      CGSizeMake(imageSize.height * scale, imageSize.width * scale) :
      CGSizeMake(imageSize.width * scale, imageSize.height * scale),
    transform
  );
  CGImageRelease(originalImage);
  CFRelease(imageProperties);
  CFRelease(imageSource);
  return result;
}


} // namespace azzapp


