#import "AZPEditableImage.h"
#import "AZPMTKImageView.h"
#import "AZPTransformations.h"
#import <AVFoundation/AVFoundation.h>

@implementation AZPEditableImage

{
  AZPMTKImageView *_imageView;
}

-(instancetype) initWithFrame:(CGRect)frame {
  if ((self = [super initWithFrame:frame])) {
    _imageView = [[AZPMTKImageView alloc] init];
    _imageView.imageTransformations = @[azzappImageEditorTransformationKey];
    _imageView.autoresizingMask = (UIViewAutoresizingFlexibleWidth |
                                   UIViewAutoresizingFlexibleHeight);
    
    self.autoresizesSubviews = YES;
    [self addSubview:_imageView];
  }
  return self;
}

-(void)setSource:(AZPEditableImageSource *)source {
  if (![_source isEqual:source]) {
    _source = source;
    __weak AZPEditableImage *weakSelf = self;
    void (^ completionHandler)(CIImage *) = ^(CIImage *image) {
      AZPEditableImage *strongSelf = weakSelf;
      if (strongSelf != nil) {
        if (image != nil && strongSelf.onLoad) {
          strongSelf.onLoad(nil);
        }
        strongSelf->_imageView.inputImage = image;
      }
    };
    if (source.kind == AZPMediaKindImage) {
      [AZPEditableImage loadImage:source.uri onLoad:completionHandler];
    } else {
      CMTime time = source.videoTime != nil
        ? CMTimeMakeWithSeconds([source.videoTime floatValue],1)
        : kCMTimeZero;
      [AZPEditableImage loadVideo:source.uri
                              atTime:time
                              onLoad:completionHandler];
    }
  }
}

-(NSDictionary *) getEditionParameters {
  return _imageView.transformationsParameters;
}


-(void)setEditionParameters:(NSDictionary *)editionParameters {
  _imageView.transformationsParameters = editionParameters;
}

-(void) setFilters:(NSArray<NSString *> *)filters {
  if (![_filters isEqual:filters]) {
    _filters = filters;
    NSMutableArray<NSString *> *imageTransformations = [
      [NSMutableArray alloc] initWithArray:@[azzappImageEditorTransformationKey]
    ];
    if (_filters != nil) {
      [imageTransformations addObjectsFromArray:_filters];
    }
    _imageView.imageTransformations = imageTransformations;
  }
}



static NSURL *lastLoadedURL;
static CIImage *lastLoadedImage;

+(void) loadImage:(NSURL *)url onLoad:(void (^)(CIImage *))onLoad {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    CIImage *image = nil;
    if (url != nil) {
      if ([lastLoadedURL isEqual:url]) {
        image = lastLoadedImage;
      } else {
        image = [[CIImage alloc] initWithContentsOfURL:url options:@{
          kCIImageApplyOrientationProperty : @YES
        }];
        lastLoadedURL = url;
        lastLoadedImage = image;
      }
    }
    dispatch_async(dispatch_get_main_queue(), ^{ onLoad(image); });
  });
}

+(void) loadVideo:(NSURL *)url atTime:(CMTime)time onLoad:(void (^)(CIImage *))onLoad {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    if (url != nil) {
      if ([lastLoadedURL isEqual:url] && time.value == kCMTimeZero.value) {
        dispatch_async(dispatch_get_main_queue(), ^{ onLoad(lastLoadedImage); });
      } else {
        AVAsset *asset = [AVAsset assetWithURL:url];
        AVAssetImageGenerator *generator = [[AVAssetImageGenerator alloc] initWithAsset:asset];
        NSValue *timeValue =  [NSValue valueWithCMTime:time];
        [generator
         generateCGImagesAsynchronouslyForTimes:@[timeValue]
         completionHandler: ^(CMTime requestedTime, CGImageRef  _Nullable cgiImage, CMTime actualTime, AVAssetImageGeneratorResult result, NSError * _Nullable error) {
          if (result == AVAssetImageGeneratorSucceeded) {
            CIImage *image =  [[CIImage alloc] initWithCGImage:cgiImage options:@{
              kCIImageApplyOrientationProperty : @YES
            }];
            // TODO very basic tricks since CIIMage doesn't get orientation properly ....
            UIInterfaceOrientation orientation = [AZPEditableImage orientationForTrack:asset];
            if (image.extent.size.width > image.extent.size.height && (orientation == UIInterfaceOrientationPortrait || orientation == UIInterfaceOrientationPortraitUpsideDown)) {
              image = [image imageByApplyingOrientation:6];
            } else if (image.extent.size.width < image.extent.size.height && (orientation == UIInterfaceOrientationLandscapeLeft || orientation == UIInterfaceOrientationLandscapeRight)) {
              image = [image imageByApplyingOrientation:8];
            }
            if (time.value == kCMTimeZero.value) {
              lastLoadedURL = url;
              lastLoadedImage = image;
            }
            dispatch_async(dispatch_get_main_queue(), ^{ onLoad(image); });
          }
        }];
      }
    }
  });
}

+ (UIInterfaceOrientation)orientationForTrack:(AVAsset *)asset
{
    AVAssetTrack *videoTrack = [[asset tracksWithMediaType:AVMediaTypeVideo] objectAtIndex:0];
    CGSize size = [videoTrack naturalSize];
    CGAffineTransform txf = [videoTrack preferredTransform];

    if (size.width == txf.tx && size.height == txf.ty)
        return UIInterfaceOrientationLandscapeRight;
    else if (txf.tx == 0 && txf.ty == 0)
        return UIInterfaceOrientationLandscapeLeft;
    else if (txf.tx == 0 && txf.ty == size.width)
        return UIInterfaceOrientationPortraitUpsideDown;
    else
        return UIInterfaceOrientationPortrait;
}

@end
