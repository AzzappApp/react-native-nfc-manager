#import <UIKit/UIKit.h>
#import <React/RCTComponent.h>
#import "AZPEditableImageSource.h"


@interface AZPEditableImage : UIView

@property (nonatomic, strong) AZPEditableImageSource *source;
@property (nonatomic, strong) NSDictionary *editionParameters;
@property (nonatomic, strong) NSArray<NSString *> *filters;
@property (nonatomic, copy) RCTDirectEventBlock onLoad;


@end


