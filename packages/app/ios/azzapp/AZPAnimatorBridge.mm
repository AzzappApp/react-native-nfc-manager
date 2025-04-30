#import <Foundation/Foundation.h>
#import "AZPAnimatorBridge.h"

@implementation AZPAnimatorBridge

+ (void)registerAnimator:(id<RNSScreenCustomStackAnimator>)animator forName:(NSString *)name {
  [RNSScreenStackAnimator registerCustomAnimator:animator forName:name];
}

@end