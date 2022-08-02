//
//  AZPSnapshotManager.m
//  azzapp
//
//  Created by François de Campredon on 11/08/2022.
//

#import "AZPSnapshotManager.h"
#import "AZPSnapshot.h"
#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>

@implementation AZPSnapshotManager

RCT_EXPORT_MODULE()

- (UIView *) view {
  return [AZPSnapshot new];
}

static NSMutableDictionary<NSString*, UIView *> *snapshotMap;

+(NSDictionary<NSString *,UIView *> *)getSnapShotMap {
  if (snapshotMap == nil) {
    snapshotMap = [[NSMutableDictionary alloc] init];
  }
  return snapshotMap;
}

RCT_EXPORT_VIEW_PROPERTY(snapshotID,  NSString *)


RCT_EXPORT_METHOD(
  snapshotView: (nonnull NSNumber *)viewTag
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject) {
   [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];
    if (view != nil) {
      UIView *snapshot = [view snapshotViewAfterScreenUpdates:NO];
      if (snapshotMap == nil) {
        snapshotMap = [[NSMutableDictionary alloc] init];
      }
      NSUUID *uuid = [NSUUID UUID];
      NSString *str = [uuid UUIDString];
      [snapshotMap setValue:snapshot forKey:str];
      resolve(str);
    } else {
      reject(@"not_found", @"View not found", nil);
    }
  }];
}



RCT_EXPORT_METHOD(
  clearSnapshot: (NSString *)uuid
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject) {
  if (uuid != nil) {
   if (snapshotMap == nil) {
     snapshotMap = [[NSMutableDictionary alloc] init];
   }
   [snapshotMap removeObjectForKey:uuid];
  }
  resolve(nil);
}

@end
