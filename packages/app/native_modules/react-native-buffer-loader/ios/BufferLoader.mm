#import "BufferLoader.h"
#import <CoreMedia/CMTime.h>

namespace azzapp {
BufferLoaderHostObject::BufferLoaderHostObject(std::shared_ptr<react::CallInvoker> callInvoker):
 callInvoker(callInvoker) {
  ciContext = [CIContext contextWithOptions:nil];
  colorSpace = CGColorSpaceCreateDeviceRGB();
}

BufferLoaderHostObject::~BufferLoaderHostObject() {
  ciContext = nil;
  CGColorSpaceRelease(colorSpace);
  colorSpace = nil;
}

CVPixelBufferRef BufferLoaderHostObject::ciImageToPixelBuffer(CIImage *ciImage) {
  CVPixelBufferRef pixelBuffer = NULL;
  NSDictionary* attributes = @{
    (NSString*)kCVPixelBufferPixelFormatTypeKey : @(kCVPixelFormatType_32BGRA),
    (NSString*)kCVPixelBufferWidthKey : @(ciImage.extent.size.width),
    (NSString*)kCVPixelBufferHeightKey : @(ciImage.extent.size.height),
    (NSString*)kCVPixelBufferMetalCompatibilityKey : @YES,
  };
  CVReturn status = CVPixelBufferCreate(
      kCFAllocatorDefault, ciImage.extent.size.width, ciImage.extent.size.height, kCVPixelFormatType_32BGRA,
      (__bridge CFDictionaryRef)attributes, &pixelBuffer);

  if (status != kCVReturnSuccess) {
    throw std::runtime_error("Failed to create CVPixelBuffer");
  }

  
  [ciContext render:ciImage toCVPixelBuffer:pixelBuffer bounds:ciImage.extent colorSpace:colorSpace];
  CVPixelBufferRetain(pixelBuffer);
  return pixelBuffer;
}
std::vector<jsi::PropNameID>
  BufferLoaderHostObject::getPropertyNames(jsi::Runtime& rt) {
    std::vector<jsi::PropNameID> result;
    result.push_back(
        jsi::PropNameID::forUtf8(rt, std::string("loadImage")));
    result.push_back(jsi::PropNameID::forUtf8(rt, std::string("loadVideoFrame")));
    result.push_back(jsi::PropNameID::forUtf8(rt, std::string("unrefBuffer")));
    return result;
  }

jsi::Value BufferLoaderHostObject::get(jsi::Runtime& runtime,
                                      const jsi::PropNameID& propNameId) {
  auto propName = propNameId.utf8(runtime);

  if (propName == "loadImage") {
    return jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "loadImage"), 3,
      [this](jsi::Runtime &runtime, const jsi::Value &thisValue,
          const jsi::Value *arguments, size_t count) -> jsi::Value {
        NSString* url = [NSString stringWithUTF8String:arguments[0]
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
        [AZPCIImageLoader
          loadImageWithUrl:url
          maxSize: maxSize
          onSuccess:^(CIImage* _Nonnull ciImage) {
              
            CVPixelBufferRef pixelBuffer;
            try {
              pixelBuffer = ciImageToPixelBuffer(ciImage);
            } catch(...){}
            
            callInvoker->invokeAsync(
              [&runtime, pixelBuffer, callback]() -> void {
                if (pixelBuffer == nullptr) {
                  callback->call(runtime, jsi::String::createFromUtf8(runtime, "Failed to create pixelBuffer"));
                  return;
                }
                auto jsBuffer = jsi::BigInt::fromUint64(runtime, reinterpret_cast<uintptr_t>(pixelBuffer));
                callback->call(runtime, jsi::Value::null(), jsBuffer);
              });
            }
          onError:^(NSError * _Nullable error) {
            callInvoker->invokeAsync(
              [&runtime, error, callback]() -> void {
                auto jsError = jsi::Object(runtime);
                auto message = error != nil ? [error localizedDescription] : @"Failed to load image";
                callback->call(runtime, jsi::String::createFromUtf8(runtime, [message UTF8String]));
              });
          }];

        return jsi::Value::undefined();
      });
  } else if(propName == "loadVideoFrame") {
    return jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "loadVideoFrame"), 3,
      [this](jsi::Runtime &runtime, const jsi::Value &thisValue,
          const jsi::Value *arguments, size_t count) -> jsi::Value {
        NSString* url = [NSString stringWithUTF8String:arguments[0]
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

        [AZPCIImageLoader
          loadVideoThumbnailWithUrl:url
          time:CMTimeMakeWithSeconds(time, NSEC_PER_SEC)
          maxSize:maxSize
          onSuccess:^(CIImage* _Nonnull ciImage) {
              
            CVPixelBufferRef pixelBuffer;
            try {
              pixelBuffer = ciImageToPixelBuffer(ciImage);
            } catch(...){}
            
            callInvoker->invokeAsync(
              [&runtime, pixelBuffer, callback]() -> void {
                if (pixelBuffer == nullptr) {
                  callback->call(runtime, jsi::String::createFromUtf8(runtime, "Failed to create pixelBuffer"));
                  return;
                }
                auto jsBuffer = jsi::BigInt::fromUint64(runtime, reinterpret_cast<uintptr_t>(pixelBuffer));
                callback->call(runtime, jsi::Value::null(), jsBuffer);
              });
            }
          onError:^(NSError * _Nullable error) {
            callInvoker->invokeAsync(
              [&runtime, error, callback]() -> void {
                auto jsError = jsi::Object(runtime);
                auto message = error != nil ? [error localizedDescription] : @"Failed to load image";
                callback->call(runtime, jsi::String::createFromUtf8(runtime, [message UTF8String]));
              });
          }];

        return jsi::Value::undefined();
      });
  } else if (propName == "unrefBuffer") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forAscii(runtime, "unrefBuffer"), 1,
        [](jsi::Runtime &runtime, const jsi::Value &thisValue,
               const jsi::Value *arguments, size_t
                count) -> jsi::Value {
          try {
            auto bigint = arguments[0].asBigInt(runtime).asUint64(runtime);
            auto buffer= reinterpret_cast<CVPixelBufferRef>(bigint);
            CVPixelBufferRelease(buffer);
          } catch(...) {
            NSLog(@"BufferLoaderHostObject unrefBuffer failed to release");
          }
          return jsi::Value::undefined();
        });
  }
  
  return jsi::Value::undefined();
}
}


@implementation AZPCIImageLoader

+ (void)loadImageWithUrl:(NSString * _Nonnull)url
                 maxSize:(CGSize)maxSize
               onSuccess:(void (^ _Nonnull __strong)(CIImage * _Nonnull __strong))onSuccess
                 onError:(void (^ _Nonnull __strong)(NSError * _Nullable __strong))onError {
    
    NSURL *imageURL = [NSURL URLWithString:url];
    if (!imageURL) {
        NSError *error = [NSError errorWithDomain:@"com.azzapp.app"
                                             code:0
                                         userInfo:@{NSLocalizedDescriptionKey: @"Failed to parse url"}];
        onError(error);
        return;
    }
    
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        @try {
            CIImage *ciImage = [[CIImage alloc] initWithContentsOfURL:imageURL options:@{
              kCIImageApplyOrientationProperty: @YES
            }];
            if (!ciImage) {
                NSError *error = [NSError errorWithDomain:@"com.azzapp.app"
                                                     code:0
                                                 userInfo:@{NSLocalizedDescriptionKey: @"Failed to handle image"}];
                onError(error);
                return;
            }
            
            if (!CGSizeEqualToSize(maxSize, CGSizeZero)) {
                CGFloat aspectRatio = ciImage.extent.size.width / ciImage.extent.size.height;
                if (aspectRatio > 1) {
                    ciImage = [ciImage imageByApplyingTransform:CGAffineTransformMakeScale(maxSize.width / ciImage.extent.size.width, maxSize.width / ciImage.extent.size.width)];
                } else {
                    ciImage = [ciImage imageByApplyingTransform:CGAffineTransformMakeScale(maxSize.height / ciImage.extent.size.height, maxSize.height / ciImage.extent.size.height)];
                }
            }
            
            onSuccess(ciImage);
        }
        @catch (NSException *exception) {
            NSError *error = [NSError errorWithDomain:@"com.azzapp.app"
                                                 code:0
                                             userInfo:@{NSLocalizedDescriptionKey: @"Failed to load image data"}];
            onError(error);
        }
    });
}


+ (void)loadVideoThumbnailWithUrl:(NSString * _Nonnull)url
                             time:(CMTime)time
                          maxSize:(CGSize)maxSize
                        onSuccess:(void (^ _Nonnull __strong)(CIImage * _Nonnull __strong))onSuccess
                          onError:(void (^ _Nonnull __strong)(NSError * _Nullable __strong))onError {
    
    NSURL *videoURL = [NSURL URLWithString:url];
    if (!videoURL) {
        NSError *error = [NSError errorWithDomain:@"com.azzapp.app"
                                             code:0
                                         userInfo:@{NSLocalizedDescriptionKey: @"Failed to parse url"}];
        onError(error);
        return;
    }
    
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        @try {
            AVAsset *asset = [AVAsset assetWithURL:videoURL];
            AVAssetImageGenerator *generator = [[AVAssetImageGenerator alloc] initWithAsset:asset];
            generator.appliesPreferredTrackTransform = YES;
            
            if (!CGSizeEqualToSize(maxSize, CGSizeZero)) {
                generator.maximumSize = maxSize;
            }
            
            NSError *generationError = nil;
            CGImageRef cgiImage = [generator copyCGImageAtTime:time actualTime:NULL error:&generationError];
            
            if (generationError) {
                onError(generationError);
                return;
            }
            
            CIImage *ciImage = [CIImage imageWithCGImage:cgiImage];
            CGImageRelease(cgiImage);
            onSuccess(ciImage);
        }
        @catch (NSException *exception) {
            NSError *error = [NSError errorWithDomain:@"com.azzapp.app"
                                                 code:0
                                             userInfo:@{NSLocalizedDescriptionKey: exception.reason}];
            onError(error);
        }
    });
}



@end
