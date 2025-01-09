//
//  AZPWidget.m
//  azzapp
//
//  Created by Sebastien Hecart on 08/12/2023.
//


#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AZPWidgetKit, NSObject)

RCT_EXTERN_METHOD(reloadAllTimelines)
RCT_EXTERN_METHOD(reloadTimelines:(NSString *)ofKind)

@end
