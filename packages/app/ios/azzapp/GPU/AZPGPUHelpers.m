//
//  GPUHelpers.m
//  azzapp
//
//  Created by François de Campredon on 22/09/2023.
//

#import <Foundation/Foundation.h>

#import <React/RCTConvert.h>
#import <React/RCTBridgeModule.h>


@interface RCT_EXTERN_MODULE(AZPGPUHelpers, NSObject)

RCT_EXTERN_METHOD(
  exportLayersToImage:(nonnull NSArray *)layers
  backgroundColor:(UIColor *)backgroundColor
  format:(nonnull NSString *)format
  quality:(nonnull NSNumber *)quality
  size:(CGSize) size
  resolve:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
);

RCT_EXTERN_METHOD(
  exportLayersToVideo:(nonnull NSArray *)layers
  backgroundColor:(UIColor *)backgroundColor
  size:(CGSize) size
  bitRate:(nonnull NSNumber *)node
  removeSound:(BOOL)removeSound
  resolve:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
);

@end
