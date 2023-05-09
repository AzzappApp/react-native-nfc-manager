//
//  AZPMediaVideoRendererManager.m
//  azzapp
//
//  Created by François de Campredon on 24/08/2022.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTConvert.h>
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(AZPMediaVideoRendererManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary *)
RCT_EXPORT_VIEW_PROPERTY(muted, BOOL)
RCT_EXPORT_VIEW_PROPERTY(paused, BOOL)
RCT_EXPORT_VIEW_PROPERTY(currentTime, NSNumber *)
RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onReadyForDisplay, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onEnd, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onProgress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onSeekComplete, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onError, RCTDirectEventBlock)

RCT_EXTERN_METHOD(
  getPlayerCurrentTime:(nonnull NSNumber*)reactTag
  resolve:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
)

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
