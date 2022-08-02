//
//  AZPSnapshot.m
//  azzapp
//
//  Created by François de Campredon on 11/08/2022.
//

#import "AZPSnapshot.h"
#import "AZPSnapshotManager.h"

@implementation AZPSnapshot

{
  UIView *_snapshotView;
}




-(void)setSnapshotID:(NSString *)snapshotID {
  if (![snapshotID isEqualToString:_snapshotID]) {
    _snapshotID = snapshotID;
    if(_snapshotView) {
      [_snapshotView removeFromSuperview];
    }
    
    NSDictionary<NSString *, UIView *> *snapshotMap = [AZPSnapshotManager getSnapShotMap];
    _snapshotView = snapshotMap[snapshotID];
    if (_snapshotView != nil) {
      self.autoresizesSubviews = YES;
      _snapshotView.frame = self.bounds;
      _snapshotView.autoresizingMask = (UIViewAutoresizingFlexibleWidth |
                                   UIViewAutoresizingFlexibleHeight);
                                   
      [self addSubview:_snapshotView];
    }
  }
}


@end
