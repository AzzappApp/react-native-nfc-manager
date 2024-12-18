//
//  AZPCustomReavealTransition.m
//  azzapp
//
//  Created by François de Campredon on 07/09/2022.
//

#import "AZPCustomReavealTransition.h"

@implementation AZPCustomReavealTransition


- (void)animateCustomWithTransitionContext:(id<UIViewControllerContextTransitioning>)transitionContext
                                      toVC:(UIViewController *)toViewController
                                    fromVC:(UIViewController *)fromViewController
                              forOperation:(UINavigationControllerOperation)operation
                               andDuration:(NSTimeInterval)duration
                               withOptions:(NSDictionary *)options
{
  CGRect fromRect = [self rectangleFromOptions:options[@"fromRectangle"]];
  CGRect toRect = [self rectangleFromOptions:options[@"toRectangle"]];
  
  NSNumber *nsFromRadius = options[@"fromRadius"];
  NSNumber *nsToRadius = options[@"toRadius"];
  CGFloat fromRadius = nsFromRadius != nil ? [nsFromRadius floatValue] : 0;
  CGFloat toRadius = nsToRadius != nil ? [nsToRadius floatValue] : 0;

  CGRect targetFrame = [transitionContext finalFrameForViewController:toViewController];
  CGAffineTransform fromTransform = CGAffineTransformMakeScale(
    fromRect.size.width / toRect.size.width,
    fromRect.size.width / toRect.size.width // scale is based on width only
  );
  
  CGPoint fromCenter = CGPointMake(
    fromRect.origin.x + fromRect.size.width / 2 - toRect.origin.x / 2,
    fromRect.origin.y + fromRect.size.width * (targetFrame.size.height / targetFrame.size.width) / 2
       - toRect.origin.y / 2
  );
  
  CGPoint targetCenter = CGPointMake(
    targetFrame.origin.x + targetFrame.size.width / 2,
    targetFrame.origin.y + targetFrame.size.height / 2
  );
  
  UIView *mask = [[UIView alloc] initWithFrame:targetFrame];
  mask.backgroundColor = [UIColor clearColor];
  UIView *areaToReveal = [[UIView alloc] init];
  areaToReveal.backgroundColor = [UIColor whiteColor];
  [mask addSubview:areaToReveal];
  
  CGRect fromRevealBounds = CGRectMake(0, 0, toRect.size.width, toRect.size.height);
  CGPoint fromRevealCenter =  CGPointMake(
    CGRectGetMidX(toRect),
    CGRectGetMidY(toRect)
  );
  
  CGRect targetRevealBounds = CGRectMake(0, 0, targetFrame.size.width, targetFrame.size.height);
  CGPoint targetRevealCenter = CGPointMake(
    CGRectGetMidX(targetFrame),
    CGRectGetMidY(targetFrame)
  );
  
  toViewController.view.frame = targetFrame;
  
  if (operation == UINavigationControllerOperationPush) {
    [[transitionContext containerView] addSubview:toViewController.view];
    
    toViewController.view.transform = fromTransform;
    toViewController.view.center = fromCenter;
    areaToReveal.bounds = fromRevealBounds;
    areaToReveal.center = fromRevealCenter;
    areaToReveal.layer.cornerRadius = fromRadius;
    
    toViewController.view.maskView = mask;
    
    [UIView animateWithDuration:duration
        animations:^{
          toViewController.view.transform = CGAffineTransformIdentity;
          toViewController.view.center = targetCenter;
          areaToReveal.bounds = targetRevealBounds;
          areaToReveal.center = targetRevealCenter;
          areaToReveal.layer.cornerRadius = toRadius;
        }
        completion:^(BOOL finished) {
          toViewController.view.transform = CGAffineTransformIdentity;
          toViewController.view.center = targetCenter;
          toViewController.view.maskView = nil;
          [transitionContext completeTransition:![transitionContext transitionWasCancelled]];
        }];
  } else if (operation == UINavigationControllerOperationPop) {
    [[transitionContext containerView] insertSubview:toViewController.view belowSubview:fromViewController.view];
    
    fromViewController.view.transform = CGAffineTransformIdentity;
    fromViewController.view.center = targetCenter;
    areaToReveal.bounds = targetRevealBounds;
    areaToReveal.center = targetRevealCenter;
    areaToReveal.layer.cornerRadius = toRadius;
  
    fromViewController.view.maskView = mask;
    
    [UIView animateWithDuration:duration
        animations:^{
          fromViewController.view.transform = fromTransform;
          fromViewController.view.center = fromCenter;
          areaToReveal.bounds = fromRevealBounds;
          areaToReveal.center = fromRevealCenter;
          areaToReveal.layer.cornerRadius = fromRadius;
        }
        completion:^(BOOL finished) {
          fromViewController.view.transform = CGAffineTransformIdentity;
          fromViewController.view.center = targetCenter;
          fromViewController.view.maskView = nil;
          [transitionContext completeTransition:![transitionContext transitionWasCancelled]];
        }];
  }
}

-(CGRect)rectangleFromOptions:(NSDictionary *)options {
  NSNumber *x = options[@"x"];
  NSNumber *y = options[@"y"];
  NSNumber *width = options[@"width"];
  NSNumber *height = options[@"height"];
  
  return CGRectMake([x floatValue], [y floatValue], [width floatValue], [height floatValue]);
}

@end
