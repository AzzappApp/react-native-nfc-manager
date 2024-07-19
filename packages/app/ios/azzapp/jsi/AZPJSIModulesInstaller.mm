//
//  AZPBufferLoader.m
//  azzapp
//
//  Created by François de Campredon on 12/05/2024.
//

#import "AZPJSIModulesInstaller.h"
#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <React/RCTUtils.h>
#import <ReactCommon/RCTTurboModule.h>
#import <WorkletRuntime.h>
#import <jsi/jsi.h>
#import "BufferLoader.h"

@implementation AZPJSIModulesInstaller

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
    
  jsi::Object wrapper = jsi::Object(runtime);
  jsi::Object bufferLoaderModule = jsi::Object::createFromHostObject(
    runtime, std::make_shared<BufferLoaderHostObject>(bridge.jsCallInvoker));
    
  wrapper.setProperty(runtime, "BufferLoader", std::move(bufferLoaderModule));

  runtime.global().setProperty(runtime, "AZPJSIModules", std::move(wrapper));
  return @true;
}

@end
