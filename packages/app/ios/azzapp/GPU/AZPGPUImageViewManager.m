//
//  AZPGPUImageViewManager.m
//  azzapp
//
//  Created by François de Campredon on 11/04/2023.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTConvert.h>
#import <React/RCTViewManager.h>


@interface RCT_EXTERN_MODULE(AZPGPUImageViewManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(layers, NSArray *)
RCT_EXPORT_VIEW_PROPERTY(onLoadStart, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onLoad, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onError, RCTDirectEventBlock)

@end
