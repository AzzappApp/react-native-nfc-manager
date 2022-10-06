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
            andBitrate:(nonnull NSNumber *)bitRate
          startTime:(nonnull NSNumber *)nsStartTime
            duration:(nonnull NSNumber *)nsDuration
        removeSound:(BOOL)removeSound
           resolver:(RCTPromiseResolveBlock)resolve
           rejecter:(RCTPromiseRejectBlock)reject
 ) {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    AVAsset* asset = [AVURLAsset assetWithURL:uri];
    NSURL *outputURL = [AZPEditableVideoManager getRandomTempFilePath:@".mp4"];
    
    CGRect cropRect = CGRectZero;
    NSDictionary *cropData = parameters[@"cropData"];
    CGFloat width = size.width;
    CGFloat height = size.height;
    if (cropData != nil) {
      cropRect = CGRectMake(
        [cropData[@"originX"] floatValue],
        [cropData[@"originY"] floatValue],
        [cropData[@"width"] floatValue],
        [cropData[@"height"] floatValue]
      );
      if (cropRect.size.width != 0 && cropRect.size.height != 0 && cropRect.size.width < width) {
        width = cropRect.size.width;
        height = cropRect.size.height;
      }
    }
    
    AVAssetTrack* videoTrack = [asset tracksWithMediaType:AVMediaTypeVideo].firstObject;
    if (videoTrack == nil) {
      reject(@"export_failure", @"no video track in provided asset", nil);
      return;
    }
    
    CMTimeRange timeRange = CMTimeRangeMake(kCMTimeZero, asset.duration);
    CGFloat startTime = [nsStartTime floatValue];
    CGFloat duration = [nsDuration floatValue];
    if (startTime >= 0 && duration > 0) {
      timeRange = CMTimeRangeMake(
        CMTimeMakeWithSeconds(startTime, 1),
        CMTimeMakeWithSeconds(duration, 1)
      );
    }

    AVAssetWriterInput *videoWriterInput=
      [AVAssetWriterInput
        assetWriterInputWithMediaType:AVMediaTypeVideo
        outputSettings:@{
          AVVideoCodecKey: AVVideoCodecTypeH264,
          AVVideoWidthKey : @(width),
          AVVideoHeightKey : @(height),
          AVVideoCompressionPropertiesKey: @{
            AVVideoProfileLevelKey: AVVideoProfileLevelH264High41,
            AVVideoMaxKeyFrameIntervalKey: @30,
            AVVideoAverageBitRateKey: bitRate
          }
        }
      ];
      
    videoWriterInput.transform = CGAffineTransformIdentity;
    videoWriterInput.expectsMediaDataInRealTime = NO;
    videoWriterInput.performsMultiPassEncodingIfSupported = YES;

    NSError *error;
    AVAssetWriter *writer = [AVAssetWriter assetWriterWithURL:outputURL fileType:AVFileTypeMPEG4 error:&error];
    if (error) {
      reject(@"export_failure", @"AVAssetWriter creation error", error);
      return;
    }
    if (![writer canAddInput:videoWriterInput]) {
      reject(@"export_failure", @"AVAssetWriter.canAddInput returned false for video input", writer.error);
      return;
    }
    [writer addInput:videoWriterInput];
    
    NSMutableDictionary *transormationsParameters = [
      [NSMutableDictionary alloc] initWithDictionary: parameters
    ];
    // remove unsuported transformations parameters
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
    
    AVMutableVideoComposition *composition =
      [AVMutableVideoComposition videoCompositionWithAsset:asset
        applyingCIFiltersWithHandler:^(AVAsynchronousCIImageFilteringRequest *request){
          CIImage *image = request.sourceImage;
          
          if (cropData != nil) {
            CGRect inversedCropRect = CGRectMake(
              cropRect.origin.x,
              image.extent.size.height - cropRect.size.height - cropRect.origin.y,
              cropRect.size.width,
              cropRect.size.height
            );
            image = [image imageByCroppingToRect:inversedCropRect];
            image = [image imageByApplyingTransform:CGAffineTransformMakeTranslation(
              -image.extent.origin.x,
              -image.extent.origin.y
            )];
          }
    
          for (NSString * transformationName in imageTransformations) {
            AZPTransformation transformation = [AZPTransformations imageTransformationForName:transformationName];
            if (transformation != nil) {
              image = transformation(image, transormationsParameters);
            }
          }
          [request finishWithImage:image context:nil];
        }];
  
    composition.renderSize = cropRect.size.width != 0 ? cropRect.size : videoTrack.naturalSize;
    composition.renderScale = 1.0;
    composition.frameDuration = CMTimeMake(1, ceil(MIN(30, MAX(videoTrack.nominalFrameRate, 25))));
    
   
    AVAssetReaderVideoCompositionOutput *videoOutput =
      [AVAssetReaderVideoCompositionOutput
        assetReaderVideoCompositionOutputWithVideoTracks:@[videoTrack] videoSettings:nil];
    videoOutput.videoComposition = composition;
    
    AVAssetReader *videoReader = [AVAssetReader assetReaderWithAsset:asset error:&error];
    if (error) {
      reject(@"export_failure", @"AVAssetReader creation error for video", error);
      return;
    }
    if (![videoReader canAddOutput:videoOutput]) {
      reject(
        @"export_failure",
        @"AVAssetReader.canAddOutput returned false for video output",
        videoReader.error
      );
      return;
    }
    [videoReader addOutput:videoOutput];
    videoReader.timeRange = timeRange;
    
    AVAssetTrack* audioTrack = [asset tracksWithMediaType:AVMediaTypeAudio].firstObject;
    AVAssetReader *audioReader = nil;
    AVAssetWriterInput *audioWriterInput;
    AVAssetReaderTrackOutput *audioOutput;
    
    BOOL hasAudio = !removeSound && audioTrack != nil;
    if (hasAudio) {
      audioWriterInput =
        [AVAssetWriterInput
          assetWriterInputWithMediaType:AVMediaTypeAudio
          outputSettings:nil
          sourceFormatHint:
            (__bridge CMFormatDescriptionRef _Nullable)[audioTrack.formatDescriptions firstObject]];
      if (![writer canAddInput:audioWriterInput]) {
        reject(
          @"export_failure",
          @"AVAssetWrite.canAddInput returned false for audio input",
          writer.error
        );
        return;
      }
      [writer addInput:audioWriterInput];
      
      audioOutput = [AVAssetReaderTrackOutput
        assetReaderTrackOutputWithTrack:audioTrack outputSettings:nil];
      audioReader =  [AVAssetReader assetReaderWithAsset:asset error:&error];
      audioReader.timeRange = timeRange;
      if (error != nil) {
        reject(@"export_failure", @"AVAssetReader creation error for audio reader", error);
        return;
      }
      if (![audioReader canAddOutput:audioOutput]) {
        reject(
          @"export_failure",
          @"AVAssetReader.canAddOutput returned false for audio output",
          videoReader.error
        );
        return;
      }
      [audioReader addOutput:audioOutput];
    }
    
    [writer startWriting];
    [videoReader startReading];
    if (hasAudio) {
      [audioReader startReading];
    }
    [writer startSessionAtSourceTime:timeRange.start];
   
    
    dispatch_queue_t dispatchQueue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0);
   
    [videoWriterInput requestMediaDataWhenReadyOnQueue:dispatchQueue usingBlock:^{
      while(videoWriterInput.isReadyForMoreMediaData) {
        if (videoReader.status == AVAssetReaderStatusFailed) {
          reject(
            @"export_failure",
            [NSString stringWithFormat:
              @"videoReader.status :  %ld", (long)videoReader.status],
            videoReader.error
          );
          return;
        }
        if (videoReader.status == AVAssetWriterStatusCompleted) {
          [videoWriterInput markAsFinished];
          if (hasAudio) {
            [audioWriterInput requestMediaDataWhenReadyOnQueue:dispatchQueue usingBlock:^{
              while (audioWriterInput.isReadyForMoreMediaData) {
                if (audioReader.status == AVAssetReaderStatusFailed) {
                  reject(
                    @"export_failure",
                    [NSString stringWithFormat:
                      @"audioReader.status : %ld", (long)audioReader.status],
                    videoReader.error
                  );
                  return;
                }
                if (audioReader.status == AVAssetReaderStatusCompleted) {
                  [audioWriterInput markAsFinished];
                  [writer finishWritingWithCompletionHandler:^{
                    resolve(outputURL.absoluteString);
                  }];
                  break;
                }
                CMSampleBufferRef sampleBuffer = [audioOutput copyNextSampleBuffer];
                if(sampleBuffer != nil ) {
                  [audioWriterInput appendSampleBuffer:sampleBuffer];
                }
              }
            }];
          } else {
            [writer finishWritingWithCompletionHandler:^{
              resolve(outputURL.absoluteString);
            }];
          }
          break;
        }
        CMSampleBufferRef sampleBuffer = [videoOutput copyNextSampleBuffer];
        if(sampleBuffer != nil ) {
          [videoWriterInput appendSampleBuffer:sampleBuffer];
        }
      }
    }];
  });
}

+(NSURL *)getRandomTempFilePath:(NSString *)ext {
  NSString* fileName = [[NSUUID UUID] UUIDString];
  NSString *filePath =  [[[NSTemporaryDirectory() stringByStandardizingPath] stringByAppendingPathComponent:fileName] stringByAppendingPathExtension:ext];
  return [NSURL fileURLWithPath:filePath];
}
 
@end
