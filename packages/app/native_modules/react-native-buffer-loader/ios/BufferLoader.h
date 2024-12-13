#pragma once

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <MetalKit/MetalKit.h>
#import <ReactCommon/CallInvoker.h>
#import <jsi/jsi.h>

namespace azzapp {

using namespace facebook;

class JSI_EXPORT BufferLoaderHostObject: public jsi::HostObject {
public:
  BufferLoaderHostObject(std::shared_ptr<react::CallInvoker> callInvoker);
  ~BufferLoaderHostObject();

  std::vector<jsi::PropNameID> getPropertyNames(facebook::jsi::Runtime &rt) override;
  jsi::Value get(facebook::jsi::Runtime &, const facebook::jsi::PropNameID &name) override;

private:
  id<MTLDevice> _Nonnull metalDevice;
  id<MTLCommandQueue> _Nonnull commandQueue;
  CGColorSpaceRef _Nonnull colorSpace;
  CIContext *_Nullable ciContext;
  std::shared_ptr<react::CallInvoker> callInvoker;
  std::unordered_map<uint64_t, id<MTLTexture>> textureCache;

  _Nullable id<MTLTexture> createMTLTextureFromCIImage(CIImage *_Nonnull image, CGSize maxSize);
  _Nullable id<MTLTexture> createMTLTextureFromCGImage(CGImageRef _Nonnull image);
  void loadTexture(
    std::shared_ptr<jsi::Function> callback,
    jsi::Runtime &runtime,
    const std::function<_Nonnull id<MTLTexture>()> &textureCreator);
};

} // namespace azzapp
