//
//  AZPEditableVideoManager.m
//  azzapp
//
//  Created by François de Campredon on 20/07/2022.
//

#import "AZPEditableVideoManager.h"
#import "AZPEditableVideo.h"
#import "AVFoundation/AVFoundation.h"


@implementation AZPEditableVideoManager


RCT_EXPORT_MODULE()

- (UIView *) view {
  return [AZPEditableVideo new];
}

RCT_EXPORT_VIEW_PROPERTY(uri, NSURL *)
RCT_EXPORT_VIEW_PROPERTY(editionParameters, NSDictionary *)
RCT_EXPORT_VIEW_PROPERTY(filters, NSArray<NSString> *)
RCT_EXPORT_VIEW_PROPERTY(onLoad, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(startTime, NSNumber *)
RCT_EXPORT_VIEW_PROPERTY(duration, NSNumber *)

 
@end
