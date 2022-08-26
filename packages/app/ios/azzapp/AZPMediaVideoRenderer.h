//
//  AZPMediaVideoRenderer.h
//  azzapp
//
//  Created by François de Campredon on 24/08/2022.
//

#import <UIKit/UIKit.h>
#import <React/RCTComponent.h>


@interface AZPMediaVideoRenderer : UIView

@property (nonatomic, strong) NSURL *uri;
@property (nonatomic, assign) BOOL muted;
@property (nonatomic, assign) BOOL paused;
@property (nonatomic, strong) NSNumber *currentTime;
@property (nonatomic, copy) RCTDirectEventBlock onReadyForDisplay;
@property (nonatomic, copy) RCTDirectEventBlock onEnd;
@property (nonatomic, copy) RCTDirectEventBlock onProgress;

-(CGFloat)getPlayerCurrentTime;

@end

