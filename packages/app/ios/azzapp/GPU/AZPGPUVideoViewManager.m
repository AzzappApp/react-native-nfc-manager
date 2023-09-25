//
//  AZPGPUVideoViewManager.m
//  azzapp
//
//  Created by François de Campredon on 13/04/2023.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTConvert.h>
#import <React/RCTViewManager.h>


@interface RCT_EXTERN_MODULE(AZPGPUVideoViewManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(layers, NSArray *)
RCT_EXPORT_VIEW_PROPERTY(paused, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onImagesLoadingStart, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onImagesLoaded, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPlayerStartBuffing, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPlayerReady, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onProgress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onError, RCTDirectEventBlock)


@end
