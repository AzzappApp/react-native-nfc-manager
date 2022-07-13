//
//  AzzappEditableImageSource.h
//  azzapp
//
//  Created by François de Campredon on 19/07/2022.
//

#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, AZPMediaKind) {
  AZPMediaKindImage,
  AZPMediaKindVideo
};

@interface AZPEditableImageSource : NSObject

@property (nonatomic, strong) NSURL *uri;
@property (nonatomic, assign) AZPMediaKind kind;
@property (nonatomic, strong) NSNumber *videoTime;

@end
