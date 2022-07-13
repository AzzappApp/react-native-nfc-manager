//
//  AZPEditableVideo.h
//  azzapp
//
//  Created by François de Campredon on 20/07/2022.
//

#import <UIKit/UIKit.h>
#import <React/RCTComponent.h>

@interface AZPEditableVideo : UIView

@property (nonatomic, strong) NSURL *uri;
@property (nonatomic, strong) NSNumber *startTime;
@property (nonatomic, strong) NSNumber *duration;
@property (nonatomic, strong) NSDictionary *editionParameters;
@property (nonatomic, strong) NSArray<NSString *> *filters;
@property (nonatomic, copy) RCTDirectEventBlock onLoad;

@end
