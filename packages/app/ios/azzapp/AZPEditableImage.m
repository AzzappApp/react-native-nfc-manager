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
  // TODO concurent access
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
  // TODO concurent access
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
            AVAssetTrack *videoTrack = [[asset tracksWithMediaType:AVMediaTypeVideo] firstObject];
            if(videoTrack == nil) {
              // TODO handle error;
              return;
            }
            CGAffineTransform orientationTransform =
              [AZPEditableImage getImageTransformForVideoTrack:videoTrack];
            
            image = [image imageByApplyingTransform:orientationTransform];
            image =[image imageByApplyingTransform:CGAffineTransformMakeTranslation(
                -image.extent.origin.x,
                -image.extent.origin.y
            )];
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

+(UIImageOrientation)orientationFor:(AVAssetTrack*)track {
  CGAffineTransform t = track.preferredTransform;
  if (t.a == 0 && t.b == 1.0 && t.d == 0) {
    return UIImageOrientationUp;
  } else if (t.a == 0 && t.b == -1.0 && t.d == 0) {
    return UIImageOrientationDown;
  } else if (t.a == 1.0 && t.b == 0 && t.c == 0) {
    return UIImageOrientationRight;
  } else if (t.a == -1.0 && t.b == 0 && t.c == 0) {
    return UIImageOrientationLeft;
  }
  NSLog(@"could not determine orientation for %@", NSStringFromCGAffineTransform(t));
  return UIImageOrientationUp;
}

+(CGAffineTransform)getImageTransformForVideoTrack:(AVAssetTrack*)track {
   UIImageOrientation orientation = [AZPEditableImage orientationFor:track];
   switch(orientation) {
    case UIImageOrientationUp:
      return CGAffineTransformMakeRotation(-M_PI_2);
    case UIImageOrientationUpMirrored:
      return CGAffineTransformScale(CGAffineTransformMakeRotation(-M_PI_2), -1, 1);
    case UIImageOrientationDown:
      return CGAffineTransformMakeRotation(M_PI_2);
    case UIImageOrientationDownMirrored:
      return CGAffineTransformScale(CGAffineTransformMakeRotation(M_PI_2), -1, 1);
    case UIImageOrientationLeft:
      return CGAffineTransformMakeRotation(M_PI);
    case UIImageOrientationLeftMirrored:
      return CGAffineTransformScale(CGAffineTransformMakeRotation(M_PI), 1, -1);
    case UIImageOrientationRight:
      return CGAffineTransformIdentity;
    case UIImageOrientationRightMirrored:
      return CGAffineTransformMakeScale(1, -1);
   }
}

@end
