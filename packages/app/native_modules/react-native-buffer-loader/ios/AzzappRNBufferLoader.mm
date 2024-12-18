#import "AzzappRNBufferLoader.h"
#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <React/RCTUtils.h>
#import <ReactCommon/RCTTurboModule.h>
#import <jsi/jsi.h>
#import "BufferLoader.h"

@implementation AzzappRNBufferLoader

RCT_EXPORT_MODULE()
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(install) {
  NSLog(@"Installing AZPBufferLoaderModule...");
  RCTBridge* bridge = [RCTBridge currentBridge];
  RCTCxxBridge* cxxBridge = (RCTCxxBridge*)bridge;
  if (cxxBridge == nil) {
    return @false;
  }
  using namespace facebook;
  using namespace azzapp;
  
  auto jsiRuntime = (jsi::Runtime*)cxxBridge.runtime;
  if (jsiRuntime == nil) {
    return @false;
  }
  auto& runtime = *jsiRuntime;
    
  jsi::Object bufferLoaderModule = jsi::Object::createFromHostObject(
    runtime, std::make_shared<BufferLoaderHostObject>(bridge.jsCallInvoker));

  runtime.global().setProperty(runtime, "Azzapp_RNBufferLoader", std::move(bufferLoaderModule));
  return @true;
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams&)params {
  return std::make_shared<facebook::react::NativeAzzappRNBufferLoaderSpecJSI>(params);
}
#endif

@end
