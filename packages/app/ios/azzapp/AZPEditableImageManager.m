#import "AZPEditableImageManager.h"
#import "AZPEditableImage.h"
#import "AZPTransformations.h"
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

RCT_EXPORT_METHOD(
        exportImage:(NSURL *)uri
     withParameters:(NSDictionary *)parameters
         andFilters:(NSArray<NSString *> *)filters
             format:(NSString *) format
            quality:(nonnull NSNumber *) quality
            forSize:(CGSize)size
           resolver:(RCTPromiseResolveBlock)resolve
           rejecter:(RCTPromiseRejectBlock)reject
 ) {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    CIImage *image = [[CIImage alloc] initWithContentsOfURL:uri options:@{
      kCIImageApplyOrientationProperty : @YES
    }];
    
    NSMutableArray<NSString *> *imageTransformations = [
      [NSMutableArray alloc] initWithArray:@[azzappImageEditorTransformationKey]
    ];
    if (filters != nil) {
      [imageTransformations addObjectsFromArray:filters];
    }
    
    NSMutableDictionary *transormationsParameters = [
      [NSMutableDictionary alloc] initWithDictionary: parameters
    ];
    transormationsParameters[@"outputSize"] = [NSValue valueWithCGSize:size];
    
    for (NSString * transformationName in imageTransformations) {
      AZPTransformation transformation = [AZPTransformations imageTransformationForName:transformationName];
      if (transformation != nil) {
        image = transformation(image, transormationsParameters);
      }
    }
    
    CIContext * ciContext = [CIContext contextWithOptions:nil];
    
    NSData* imageData;
    NSString* fileName = [[NSUUID UUID] UUIDString];
    NSString* ext;
    if ([format isEqualToString:@"JPEG"]) {
      NSString *qualityKey = (NSString *)kCGImageDestinationLossyCompressionQuality;
      id options = @{ qualityKey: quality };
      imageData = [ciContext JPEGRepresentationOfImage:image
                                            colorSpace:image.colorSpace
                                               options:options];
      ext= @"jpeg";
    } else {
      imageData = [ciContext PNGRepresentationOfImage:image
                                               format:kCIFormatBGRA8
                                           colorSpace:image.colorSpace
                                              options:@{}];
      ext = @"png";
    }
    if (imageData == nil) {
      reject(@"export_failure", @"could not export image to data", nil);
      return;
    }
  
  
    NSString *filePath =  [[[NSTemporaryDirectory() stringByStandardizingPath] stringByAppendingPathComponent:fileName] stringByAppendingPathExtension:ext];
    BOOL success = [[NSFileManager defaultManager]
                    createFileAtPath:filePath
                    contents:imageData
                    attributes:nil];
    if (success) {
      resolve(filePath);
    } else {
      reject(@"export_failure", [NSString stringWithFormat:@"Error %d : %s", errno, strerror(errno)], nil);
    }
  });
}

@end
