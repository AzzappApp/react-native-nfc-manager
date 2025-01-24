#pragma once

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <MetalKit/MetalKit.h>
#import <ReactCommon/CallInvoker.h>
#import <MetalKit/MetalKit.h>
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
  MTKTextureLoader * _Nonnull textureLoader;
  
  std::shared_ptr<react::CallInvoker> callInvoker;
  std::unordered_map<uint64_t, id<MTLTexture>> textureCache;

  _Nullable CGImageRef loadImageWithOrientation(NSURL * _Nonnull url, CGSize maxSize);
  void loadTexture(
    std::shared_ptr<jsi::Function> callback,
    jsi::Runtime &runtime,
    const std::function<_Nonnull id<MTLTexture>()> &textureCreator);
};

} // namespace azzapp
