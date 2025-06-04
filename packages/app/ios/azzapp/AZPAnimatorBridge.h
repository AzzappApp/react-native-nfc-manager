#import <RNScreens/RNSScreenStackAnimator.h>


@interface AZPAnimatorBridge : NSObject

+ (void)registerAnimator:(id<RNSScreenCustomStackAnimator>)animator forName:(NSString *)name;

@end
