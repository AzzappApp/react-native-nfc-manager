//
//  AZPMediaHelper.m
//  azzapp
//
//  Created by François de Campredon on 04/10/2022.
//

#import <React/RCTConvert.h>
#import <React/RCTBridgeModule.h>


@interface RCT_EXTERN_MODULE(AZPMediaHelpers, NSObject)

RCT_EXTERN_METHOD(
  getVideoSize:(NSURL *)uri
  resolve:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  getPHAssetPath:(NSString *)internalId
  resolve:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  segmentImage:(NSURL *)uri
  resolve:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  prefetchImage:(NSURL *)uri
  resolve:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  observeImagePrefetchResult:(NSURL *)uri
  resolve:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  cancelImagePrefetch:(NSURL *)uri
)

RCT_EXTERN_METHOD(
  addLocalCachedImage:(NSString *)mediaId
  url:(NSURL *)url
)

RCT_EXTERN_METHOD(
  prefetchVideo:(NSURL *)uri
  resolve:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  observeVideoPrefetchResult:(NSURL *)uri
  resolve:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  cancelVideoPrefetch:(NSURL *)uri
)

RCT_EXTERN_METHOD(
  addLocalCachedVideo:(NSString *)mediaId
  url:(NSURL *)url
)


@end
