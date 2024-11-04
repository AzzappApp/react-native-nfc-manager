#pragma once

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <CoreImage/CoreImage.h>
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
  CVPixelBufferRef _Nullable ciImageToPixelBuffer(CIImage * _Nonnull image);
  CIContext * _Nonnull ciContext;
  CGColorSpaceRef _Nonnull colorSpace;
  std::shared_ptr<react::CallInvoker> callInvoker;
};
}


@interface AZPCIImageLoader : NSObject
+ (void)loadImageWithUrl:(NSString * _Nonnull)url 
  maxSize:(CGSize)size 
  onSuccess:(void (^ _Nonnull)(CIImage * _Nonnull))onSuccess 
  onError:(void (^ _Nonnull)(NSError * _Nullable))onError;
  
+ (void)loadVideoThumbnailWithUrl:(NSString * _Nonnull)url
  time:(CMTime)time maxSize:(CGSize)size 
  onSuccess:(void (^ _Nonnull)(CIImage * _Nonnull))onSuccess 
  onError:(void (^ _Nonnull)(NSError * _Nullable))onError;
@end
