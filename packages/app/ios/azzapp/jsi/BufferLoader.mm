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
      runtime, jsi::PropNameID::forAscii(runtime, "loadImage"), 2,
      [this](jsi::Runtime &runtime, const jsi::Value &thisValue,
          const jsi::Value *arguments, size_t count) -> jsi::Value {
        NSString* url = [NSString stringWithUTF8String:arguments[0]
                                                      .asString(runtime)
                                                      .utf8(runtime)
                                                      .c_str()];
        auto callback = std::make_shared<jsi::Function>(arguments[1].asObject(runtime).asFunction(runtime));
        [AZPCIImageLoader
          loadImageWithUrl:url
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
        auto callback = std::make_shared<jsi::Function>(arguments[2].asObject(runtime).asFunction(runtime));

        [AZPCIImageLoader
          loadVideoThumbnailWithUrl:url
          time:CMTimeMakeWithSeconds(time, NSEC_PER_SEC)
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
