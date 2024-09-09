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

@end
