#import "AZPEditableImageManager.h"
#import "AZPEditableImage.h"
#import "AZPEditableImageSource.h"
@implementation AZPEditableImageManager


RCT_EXPORT_MODULE()

- (UIView *) view {
  return [AZPEditableImage new];
}

RCT_CUSTOM_VIEW_PROPERTY(source, AzzappEditableImageSource *, AZPEditableImage)
{
  if (json == nil) {
    [view setSource:nil];
  }
  AZPEditableImageSource * source= [[AZPEditableImageSource alloc] init];
  
  source.uri = [RCTConvert NSURL:json[@"uri"]];
  if ([json[@"kind"] isEqualToString:@"video"]) {
    source.kind = AZPMediaKindVideo;
  } else {
    source.kind = AZPMediaKindImage;
  }
  source.videoTime = [RCTConvert NSNumber:json[@"videoTime"]];
  [view setSource:source];
}
RCT_EXPORT_VIEW_PROPERTY(editionParameters, NSDictionary *)
RCT_EXPORT_VIEW_PROPERTY(filters, NSArray<NSString> *)
RCT_EXPORT_VIEW_PROPERTY(onLoad, RCTDirectEventBlock)

@end
