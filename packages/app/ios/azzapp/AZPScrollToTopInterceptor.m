//
//  AZPScrollToTopInterceptor.m
//  azzapp
//
//  Created by François de Campredon on 28/08/2022.
//

#import "AZPScrollToTopInterceptor.h"
#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>
#import <React/RCTScrollView.h>
#import <React/RCTUIManagerUtils.h>




@interface ScrollToTopInterceptor: NSObject <UIScrollViewDelegate>

typedef void (^ScrollToTopHandler)(void);
@property (nonatomic, retain) NSNumber *interceptorID;
@property (nonatomic, retain) RCTEventEmitter* eventEmitter;
@property (nonatomic, retain) RCTScrollView *scrollView;
@end


@implementation ScrollToTopInterceptor

-(BOOL)scrollViewShouldScrollToTop:(UIScrollView *)scrollView {
  [self.eventEmitter sendEventWithName:@"onScrollToTop" body:@{@"interceptorID": self.interceptorID}];
  return NO;
}

@end


@implementation AZPScrollToTopInterceptor

{
  NSMutableDictionary<NSNumber *, ScrollToTopInterceptor *> *_interceptors;
  CGFloat _interceptorIdCounter;
}
  

RCT_EXPORT_MODULE()

- (NSArray<NSString *> *)supportedEvents {
  return @[@"onScrollToTop"];
}

- (dispatch_queue_t)methodQueue
{
  return RCTGetUIManagerQueue();
}

RCT_EXPORT_METHOD(
  addScrollToTopInterceptor: (nonnull NSNumber *)reactTag
                   resolver:(RCTPromiseResolveBlock)resolve
                   rejecter:(RCTPromiseRejectBlock)reject) {
    [self.bridge.uiManager addUIBlock:
      ^(
        RCTUIManager *uiManager,
        NSDictionary<NSNumber *, UIView *> *viewRegistry
      ) {
        UIView *view = viewRegistry[reactTag];
        if (!view || ![view isKindOfClass:[RCTScrollView class]]) {
          return;
        }
        ScrollToTopInterceptor *interceptor = [ScrollToTopInterceptor new];
        interceptor.interceptorID = @(self->_interceptorIdCounter++);
        interceptor.scrollView = (RCTScrollView *)view;
        interceptor.eventEmitter = self;
        [interceptor.scrollView addScrollListener:interceptor];
        
        if(self->_interceptors == nil) {
          self->_interceptors = [[NSMutableDictionary alloc] init];
        }
        self->_interceptors[interceptor.interceptorID] = interceptor;
        
        resolve(@{ @"interceptorID": interceptor.interceptorID });
      }
    ];
  }
  
RCT_EXPORT_METHOD(
  removeScrollToTopInterceptor: (nonnull NSNumber *)interceptorID) {
    if(_interceptors == nil) {
      return;
    }
    ScrollToTopInterceptor *interceptor = _interceptors[interceptorID];
    if (interceptor == nil) {
      return;
    }
    [interceptor.scrollView removeScrollListener:interceptor];
    interceptor.scrollView = nil;
    [_interceptors removeObjectForKey:interceptorID];
  }
@end
