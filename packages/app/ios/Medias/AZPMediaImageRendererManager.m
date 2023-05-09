#import <React/RCTBridgeModule.h>
#import <React/RCTConvert.h>
#import <React/RCTViewManager.h>


@interface RCT_EXTERN_MODULE(AZPMediaImageRendererManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary *)
RCT_EXPORT_VIEW_PROPERTY(onLoad, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPlaceHolderImageLoad, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onError, RCTDirectEventBlock)

RCT_EXTERN_METHOD(
  prefetch:(NSURL *)uri
  resolve:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  obervePrefetchResult:(NSURL *)uri
  resolve:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  cancelPrefetch:(NSURL *)uri
)

RCT_EXTERN_METHOD(
  addLocalCachedFile:(NSString *)mediaID
  url:(NSURL *)url
)

@end
