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
}

BufferLoaderHostObject::~BufferLoaderHostObject() {
  colorSpace = nil;
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
            CGImageRef cgImage = loadImageWithOrientation(imageURL);

            auto texture = createMTLTextureFromCGImage(cgImage, maxSize);
            CGImageRelease(cgImage);
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

            id<MTLTexture> texture = createMTLTextureFromCGImage(cgImage, maxSize);
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
id<MTLTexture> BufferLoaderHostObject::createMTLTextureFromCGImage(CGImageRef image, CGSize maxSize) {
  @autoreleasepool {
    size_t width = CGImageGetWidth(image);
    size_t height = CGImageGetHeight(image);

    if (!CGSizeEqualToSize(maxSize, CGSizeZero)) {
      CGFloat aspectRatio = (CGFloat)width / (CGFloat)height;
      if (aspectRatio > 1) {
        width = maxSize.width;
        height = width / aspectRatio;
      } else {
        height = maxSize.height;
        width = height * aspectRatio;
      }
    }

    // 1. Creating a shared temporary texture to copy the image data
    MTLTextureDescriptor *tempDescriptor = [[MTLTextureDescriptor alloc] init];
    tempDescriptor.pixelFormat = MTLPixelFormatBGRA8Unorm;
    tempDescriptor.width = width;
    tempDescriptor.height = height;
    tempDescriptor.usage = MTLTextureUsageShaderRead | MTLTextureUsageShaderWrite;
    tempDescriptor.storageMode = MTLStorageModeShared;  // Important !

    id<MTLTexture> tempTexture = [metalDevice newTextureWithDescriptor:tempDescriptor];
    if (!tempTexture) {
      throw std::runtime_error("Failed to create temporary Metal texture");
    }

    // 2. Creating a private (gpu only) final texture
    MTLTextureDescriptor *finalDescriptor = [[MTLTextureDescriptor alloc] init];
    finalDescriptor.pixelFormat = MTLPixelFormatBGRA8Unorm;
    finalDescriptor.width = width;
    finalDescriptor.height = height;
    finalDescriptor.usage = MTLTextureUsageShaderRead | MTLTextureUsageShaderWrite;
    finalDescriptor.storageMode = MTLStorageModePrivate;

    id<MTLTexture> finalTexture = [metalDevice newTextureWithDescriptor:finalDescriptor];
    if (!finalTexture) {
      throw std::runtime_error("Failed to create final Metal texture");
    }

    // 3. Transfer the image data to the temporary texture using a CGContext
    void *imageData = malloc(width * height * 4);
    CGContextRef context = CGBitmapContextCreate(imageData, width, height, 8, width * 4,
                                               CGColorSpaceCreateDeviceRGB(),
                                               kCGImageAlphaPremultipliedFirst | kCGBitmapByteOrder32Little);
    if (!context) {
      free(imageData);
      throw std::runtime_error("Failed to create CGContext");
    }

    CGContextDrawImage(context, CGRectMake(0, 0, width, height), image);
    
    MTLRegion region = MTLRegionMake2D(0, 0, width, height);
    [tempTexture replaceRegion:region mipmapLevel:0 withBytes:imageData bytesPerRow:width * 4];

    // 4. Using a blit encoder to copy the data to the final texture (from cpu to gpu)
    id<MTLCommandBuffer> commandBuffer = [commandQueue commandBuffer];
    id<MTLBlitCommandEncoder> blitEncoder = [commandBuffer blitCommandEncoder];
    
    [blitEncoder copyFromTexture:tempTexture
                    sourceSlice:0
                    sourceLevel:0
                   sourceOrigin:MTLOriginMake(0, 0, 0)
                     sourceSize:MTLSizeMake(width, height, 1)
                      toTexture:finalTexture
               destinationSlice:0
               destinationLevel:0
              destinationOrigin:MTLOriginMake(0, 0, 0)];
    
    [blitEncoder endEncoding];
    [commandBuffer commit];
    [commandBuffer waitUntilCompleted];
    [tempTexture setPurgeableState:MTLPurgeableStateEmpty];

    // 5. Release the resources
    CGContextRelease(context);
    free(imageData);

    return finalTexture;
  }
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


CGImageRef BufferLoaderHostObject::loadImageWithOrientation(NSURL *url) {
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
    
    // If the image is already in the correct orientation, return it
    if (orientation == 1) {
        CFRelease(imageProperties);
        CFRelease(imageSource);
        return originalImage;
    }
    
    // Apply the orientation
    CGSize imageSize = CGSizeMake(CGImageGetWidth(originalImage), CGImageGetHeight(originalImage));
    CGAffineTransform transform = CGAffineTransformIdentity;
    BOOL swapWidthHeight = NO;
    
    switch (orientation) {
        case 2:
            // Horizontal flip
            transform = CGAffineTransformMakeScale(-1.0, 1.0);
            transform = CGAffineTransformTranslate(transform, -imageSize.width, 0);
            break;
            
        case 3:
            // 180° rotation
            transform = CGAffineTransformMakeRotation(M_PI);
            transform = CGAffineTransformTranslate(transform, -imageSize.width, -imageSize.height);
            break;
            
        case 4:
            // Vertical flip
            transform = CGAffineTransformMakeScale(1.0, -1.0);
            transform = CGAffineTransformTranslate(transform, 0, -imageSize.height);
            break;
            
        case 5:
            // Horizontal flip + 90° rotation
            swapWidthHeight = YES;
            transform = CGAffineTransformMakeScale(-1.0, 1.0);
            transform = CGAffineTransformRotate(transform, -M_PI_2);
            break;
            
        case 6:
            // 90° rotation
            swapWidthHeight = YES;
            transform = CGAffineTransformMakeRotation(-M_PI_2);
            transform = CGAffineTransformTranslate(transform, -imageSize.width, 0);
            break;
            
        case 7:
            // Horizontal flip + 270° rotation
            swapWidthHeight = YES;
            transform = CGAffineTransformMakeScale(-1.0, 1.0);
            transform = CGAffineTransformRotate(transform, M_PI_2);
            break;
            
        case 8:
            // 270° rotation
            swapWidthHeight = YES;
            transform = CGAffineTransformMakeRotation(M_PI_2);
            transform = CGAffineTransformTranslate(transform, 0, -imageSize.height);
            break;
    }
    
    // Creating the new image
    CGSize newSize = swapWidthHeight ? 
        CGSizeMake(imageSize.height, imageSize.width) : 
        CGSizeMake(imageSize.width, imageSize.height);
        
    CGContextRef context = CGBitmapContextCreate(NULL,
                                               newSize.width,
                                               newSize.height,
                                               CGImageGetBitsPerComponent(originalImage),
                                               0,
                                               CGImageGetColorSpace(originalImage),
                                               CGImageGetBitmapInfo(originalImage));
    
    if (!context) {
        CGImageRelease(originalImage);
        CFRelease(imageProperties);
        CFRelease(imageSource);
        throw std::runtime_error("Failed to create context");
    }
    
    // Apply the transform to the context and draw the image
    CGContextConcatCTM(context, transform);
    CGContextDrawImage(context, CGRectMake(0, 0, imageSize.width, imageSize.height), originalImage);
    
    // Create the new image
    CGImageRef rotatedImage = CGBitmapContextCreateImage(context);
    
    // Release the resources
    CGContextRelease(context);
    CGImageRelease(originalImage);
    CFRelease(imageProperties);
    CFRelease(imageSource);
    
    return rotatedImage;
}


} // namespace azzapp


