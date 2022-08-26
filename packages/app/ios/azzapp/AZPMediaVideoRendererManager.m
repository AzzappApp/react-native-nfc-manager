//
//  AZPMediaVideoRendererManager.m
//  azzapp
//
//  Created by François de Campredon on 24/08/2022.
//

#import <React/RCTUIManager.h>
#import "AZPMediaVideoRendererManager.h"
#import "AZPMediaVideoRenderer.h"

@implementation AZPMediaVideoRendererManager

RCT_EXPORT_MODULE()

- (UIView *) view {
  return [AZPMediaVideoRenderer new];
}

RCT_EXPORT_VIEW_PROPERTY(uri, NSURL *)
RCT_EXPORT_VIEW_PROPERTY(muted, BOOL)
RCT_EXPORT_VIEW_PROPERTY(paused, BOOL)
RCT_EXPORT_VIEW_PROPERTY(currentTime, NSNumber *)
RCT_EXPORT_VIEW_PROPERTY(onReadyForDisplay, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onEnd, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onProgress, RCTDirectEventBlock)


RCT_EXPORT_METHOD(
  getPlayerCurrentTime:(nonnull NSNumber*)reactTag
              resolver:(RCTPromiseResolveBlock)resolve
              rejecter:(RCTPromiseRejectBlock)reject) {
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    if (!view || ![view isKindOfClass:[AZPMediaVideoRenderer class]]) {
      reject(
        @"INVALID_CALL",
        [NSString stringWithFormat:@"Cannot find NativeView with tag #%@", reactTag],
        nil
      );
      return;
    }
    AZPMediaVideoRenderer *videoRenderer = (AZPMediaVideoRenderer *)view;
    resolve(@{ @"currentTime": @([videoRenderer getPlayerCurrentTime]) });
  }];
}



@end
