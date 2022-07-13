//
//  AZPEditableVideoManager.m
//  azzapp
//
//  Created by François de Campredon on 20/07/2022.
//

#import "AZPEditableVideoManager.h"
#import "AZPEditableVideo.h"
#import "AZPTransformations.h"
#import "AVFoundation/AVFoundation.h"


@implementation AZPEditableVideoManager


RCT_EXPORT_MODULE()

- (UIView *) view {
  return [AZPEditableVideo new];
}

RCT_EXPORT_VIEW_PROPERTY(uri, NSURL *)
RCT_EXPORT_VIEW_PROPERTY(editionParameters, NSDictionary *)
RCT_EXPORT_VIEW_PROPERTY(filters, NSArray<NSString> *)
RCT_EXPORT_VIEW_PROPERTY(onLoad, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(startTime, NSNumber *)
RCT_EXPORT_VIEW_PROPERTY(duration, NSNumber *)



RCT_EXPORT_METHOD(
        exportVideo:(NSURL *)uri
     withParameters:(NSDictionary *)parameters
         andFilters:(NSArray<NSString *> *)filters
            forSize:(CGSize)size
          startTime:(nonnull NSNumber *) nsStartTime
            duration:(nonnull NSNumber *) nsDuration
        removeSound:(BOOL)removeSound
           resolver:(RCTPromiseResolveBlock)resolve
           rejecter:(RCTPromiseRejectBlock)reject
 ) {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    AVAsset* asset = [AVURLAsset assetWithURL:uri];
    
    CMTimeRange timeRange = CMTimeRangeMake(kCMTimeZero, asset.duration);
    
    CGFloat startTime = [nsStartTime floatValue];
    CGFloat duration = [nsDuration floatValue];
    if (startTime >= 0 && duration > 0) {
      timeRange = CMTimeRangeMake(CMTimeMakeWithSeconds(startTime, 1), CMTimeMakeWithSeconds(duration, 1));
    }
    // TODO fix this code that create problems with the video
    /*if (removeSound) {
      AVMutableComposition *mutableComposition = [AVMutableComposition composition];
      AVAssetTrack *videoTrack = [[asset tracksWithMediaType:AVMediaTypeVideo] firstObject];
      if (videoTrack == nil) {
        reject(@"could_not_find_video_track", @"The file does not contains a video track", nil);
        return;
      }
      
      AVMutableCompositionTrack *mutableCompositionVideoTrack = [mutableComposition addMutableTrackWithMediaType:AVMediaTypeVideo preferredTrackID:kCMPersistentTrackID_Invalid];
      
      
      [mutableCompositionVideoTrack insertTimeRange:timeRange
                                            ofTrack:videoTrack
                                             atTime:kCMTimeZero
                                              error:nil];
      
      asset = mutableComposition;
    }*/
    
    
   
    CGRect cropRect = CGRectZero;
    NSDictionary *cropData = parameters[@"cropData"];
    
    if (cropData != nil) {
      NSNumber *originX = cropData[@"originX"];
      NSNumber *originY = cropData[@"originY"];
      NSNumber *width = cropData[@"width"];
      NSNumber *height = cropData[@"height"];
      
      cropRect = CGRectMake(
        [originX floatValue],
        [originY floatValue],
        [width floatValue],
        [height floatValue]
      );
    }
    [AZPEditableVideoManager cropVideo:asset cropRect:cropRect timeRange:timeRange
      withCompletionHandler:^(BOOL success, BOOL hasBeenCropped, AVAsset * asset) {
      if (!success) {
        reject(@"export_failure", @"failure during video transformation", nil);
        return;
      }
      CMTimeRange newTimeRange = timeRange;
      if (hasBeenCropped) {
        newTimeRange = CMTimeRangeMake(kCMTimeZero, asset.duration);
      }
      NSMutableDictionary *transormationsParameters = [
        [NSMutableDictionary alloc] initWithDictionary: parameters
      ];
      [transormationsParameters removeObjectForKey:@"cropData"];
      [transormationsParameters removeObjectForKey:@"orientation"];
      [transormationsParameters removeObjectForKey:@"pitch"];
      [transormationsParameters removeObjectForKey:@"roll"];
      [transormationsParameters removeObjectForKey:@"yaw"];
      
      NSMutableArray<NSString *> *imageTransformations = [
        [NSMutableArray alloc] initWithArray:@[azzappImageEditorTransformationKey]
      ];
      if (filters != nil) {
        [imageTransformations addObjectsFromArray:filters];
      }
      AVMutableVideoComposition *composition = [
        AVMutableVideoComposition videoCompositionWithAsset:asset
                        applyingCIFiltersWithHandler:^(AVAsynchronousCIImageFilteringRequest *request){
              // Clamp to avoid blurring transparent pixels at the image edges
              CIImage *image = [request.sourceImage imageByClampingToExtent];
              for (NSString * transformationName in imageTransformations) {
                AZPTransformation transformation = [AZPTransformations imageTransformationForName:transformationName];
                if (transformation != nil) {
                  image = transformation(image, transormationsParameters);
                }
              }
              [request finishWithImage:image context:nil];
          }];
          
      composition.renderSize = size;
      if (cropRect.size.width != 0 && (cropRect.size.width < size.width ||cropRect.size.height < size.height)) {
        composition.renderSize = cropRect.size;
      }
      
      NSString *presetName = AVAssetExportPresetHighestQuality;
      CGFloat maxSize = size.width > size.height ? size.width : size.height;
      if (maxSize <= 640) {
        presetName = AVAssetExportPreset640x480;
      } else if (maxSize <= 960) {
        presetName = AVAssetExportPreset960x540;
      } else if (maxSize <= 1280) {
        presetName = AVAssetExportPreset1280x720;
      } else if (maxSize <= 1920) {
        presetName = AVAssetExportPreset1920x1080;
      }
      
      [AZPEditableVideoManager exportAsset:asset withPresset:presetName timeRange:newTimeRange compositon:composition withCompletionHandler:^(AVAssetExportSessionStatus status, NSString *filePath) {
         if (status == AVAssetExportSessionStatusCompleted) {
          resolve(filePath);
        } else {
          reject(@"export_failure", @"failure during asset export", nil);
        }
      }];
    }];
  });
}


+(void)cropVideo:(AVAsset *)asset
  cropRect:(CGRect)cropRect
  timeRange:(CMTimeRange)timeRange
  withCompletionHandler:(void (^)(BOOL,BOOL, AVAsset *))handler {
  
  if (cropRect.origin.x != 0 || cropRect.size.height != 0) {
    AVAssetTrack *videoTrack = [[asset tracksWithMediaType:AVMediaTypeVideo] firstObject];
    if (videoTrack != nil) {
      CGSize naturalSize = videoTrack.naturalSize;
      AVMutableVideoCompositionInstruction *instruction =
        [AVMutableVideoCompositionInstruction videoCompositionInstruction];
      instruction.timeRange = timeRange;
      AVMutableVideoCompositionLayerInstruction *layerInstruction =
        [AVMutableVideoCompositionLayerInstruction videoCompositionLayerInstructionWithAssetTrack:videoTrack];
      
      CGFloat tx = cropRect.origin.x;
      CGFloat ty = cropRect.origin.y;
      UIInterfaceOrientation orientation = [AZPEditableVideoManager orientationFor:videoTrack];
      
      CGAffineTransform transform = CGAffineTransformIdentity;
      switch(orientation) {
        case UIInterfaceOrientationUnknown:
          transform = CGAffineTransformTranslate(videoTrack.preferredTransform, tx, ty);
          break;
        case UIInterfaceOrientationPortrait:
          transform =
            CGAffineTransformConcat(
              CGAffineTransformMakeTranslation(-ty, tx),
              CGAffineTransformConcat(
                CGAffineTransformMakeRotation(M_PI_2),
                CGAffineTransformMakeTranslation(naturalSize.height, 0)
              )
            );
          break;
        case UIInterfaceOrientationPortraitUpsideDown:
          transform =
            CGAffineTransformConcat(
              CGAffineTransformMakeTranslation(ty, -tx),
              CGAffineTransformConcat(
                CGAffineTransformMakeRotation(-M_PI_2),
                CGAffineTransformMakeTranslation(-naturalSize.height, 0)
              )
            );
          break;
        case UIInterfaceOrientationLandscapeLeft:
          transform =
            CGAffineTransformConcat(
              CGAffineTransformMakeTranslation(tx, ty),
              CGAffineTransformConcat(
                CGAffineTransformMakeRotation(-M_PI),
                CGAffineTransformMakeTranslation(-naturalSize.width, -naturalSize.height)
              )
            );
          break;
        case UIInterfaceOrientationLandscapeRight:
          transform = CGAffineTransformMakeTranslation(-tx, -ty);
          break;
      }
      [layerInstruction setTransform:transform atTime:kCMTimeZero];
      instruction.layerInstructions = @[layerInstruction];
      AVMutableVideoComposition *composition = [AVMutableVideoComposition videoCompositionWithPropertiesOfAsset:asset];
      composition.renderSize = cropRect.size;
      composition.instructions = @[instruction];
      [AZPEditableVideoManager exportAsset:asset
                               withPresset:AVAssetExportPresetHighestQuality
                                 timeRange:timeRange
                                compositon:composition
                     withCompletionHandler:^(AVAssetExportSessionStatus status, NSString * filePath) {
        
        if (status == AVAssetExportSessionStatusCompleted) {
          handler(YES, YES, [AVAsset assetWithURL:[NSURL fileURLWithPath:filePath]]);
        } else {
          handler(NO, NO, nil);
        }
      }];
    }
  } else {
    handler(YES, NO, asset);
  }
}
                 
                 
+(void)exportAsset:(AVAsset *)asset  withPresset:(NSString *)presetName
                                       timeRange:(CMTimeRange)timeRange
                                      compositon:(AVVideoComposition *)composition
                           withCompletionHandler:(void (^)(AVAssetExportSessionStatus, NSString *))handler {
  AVAssetExportSession *exportSession = [AVAssetExportSession
                                           exportSessionWithAsset:asset
                                           presetName:presetName];
  exportSession.timeRange = timeRange;
  exportSession.videoComposition = composition;
  NSString* fileName = [[NSUUID UUID] UUIDString];
  NSString* ext = @"mov";
  NSString *filePath =  [[[NSTemporaryDirectory() stringByStandardizingPath] stringByAppendingPathComponent:fileName] stringByAppendingPathExtension:ext];
  exportSession.outputURL = [NSURL fileURLWithPath:filePath];
  exportSession.outputFileType = AVFileTypeQuickTimeMovie;
  exportSession.shouldOptimizeForNetworkUse = YES;
  
  [exportSession exportAsynchronouslyWithCompletionHandler:^{
    handler(exportSession.status, filePath);
  }];
}


+(UIInterfaceOrientation)orientationFor:(AVAssetTrack*)track  {
  CGAffineTransform t = track.preferredTransform;
    
  if(t.a == 0 && t.b == 1.0 && t.c == -1.0 && t.d == 0) {             // Portrait
    return UIInterfaceOrientationPortrait;
  } else if(t.a == 0 && t.b == -1.0 && t.c == 1.0 && t.d == 0) {      // PortraitUpsideDown
    return UIInterfaceOrientationPortraitUpsideDown;
  } else if(t.a == 1.0 && t.b == 0 && t.c == 0 && t.d == 1.0) {       // LandscapeRight
    return UIInterfaceOrientationLandscapeRight;
  } else if(t.a == -1.0 && t.b == 0 && t.c == 0 && t.d == -1.0) {     // LandscapeLeft
    return UIInterfaceOrientationLandscapeLeft;
  } else {
    return UIInterfaceOrientationPortrait;
  }
}
 
@end
