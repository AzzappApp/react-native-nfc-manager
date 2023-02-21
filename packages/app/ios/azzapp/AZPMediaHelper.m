//
//  AZPMediaHelper.m
//  azzapp
//
//  Created by François de Campredon on 04/10/2022.
//

#import "AZPMediaHelper.h"
#import <React/RCTConvert.h>
#import <AVFoundation/AVFoundation.h>
#import <Photos/Photos.h>
#import <Vision/Vision.h>

#import "AZPTransformations.h"
#import "azzapp-Swift.h"

@implementation AZPMediaHelper

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(
  getVideoSize:(NSURL *)uri
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
) {
  AVURLAsset *asset = [AVURLAsset URLAssetWithURL:uri options:nil];
  NSArray *tracks = [asset tracksWithMediaType:AVMediaTypeVideo];
  AVAssetTrack *track = [tracks firstObject];
  if (track == nil) {
    reject(@"failure", @"No video track", nil);
  } else {
    resolve(@{ @"width": @(track.naturalSize.width), @"height": @(track.naturalSize.height) });
  }
}


RCT_EXPORT_METHOD(
  getPHAssetPath:(NSString *)internalId
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
) {
    
  PHFetchResult<PHAsset *> *fetchResult;
  PHAsset *asset;
  
  NSString *mediaIdentifier = internalId;
  
  if ([internalId rangeOfString:@"ph://"].location != NSNotFound) {
    mediaIdentifier = [internalId stringByReplacingOccurrencesOfString:@"ph://"
                                                                 withString:@""];
  }
  
  fetchResult = [PHAsset fetchAssetsWithLocalIdentifiers:@[mediaIdentifier] options:nil];
  if(fetchResult){
    asset = fetchResult.firstObject;//only object in the array.
  }
  
  if(asset != nil) {
    __block NSURL *imageURL = [[NSURL alloc]initWithString:@""];
    NSArray<PHAssetResource *> *const assetResources = [PHAssetResource assetResourcesForAsset:asset];
    if (![assetResources firstObject]) {
      return;
    }
    __block NSString *filePath = @"";

    PHContentEditingInputRequestOptions *const editOptions = [PHContentEditingInputRequestOptions new];
    // Download asset if on icloud.
    editOptions.networkAccessAllowed = YES;
    
    [asset requestContentEditingInputWithOptions:editOptions completionHandler:^(PHContentEditingInput *contentEditingInput, NSDictionary *info) {
      imageURL = contentEditingInput.fullSizeImageURL;
      if ([contentEditingInput.audiovisualAsset isKindOfClass:[AVURLAsset class]]) {
        AVURLAsset *asset = (AVURLAsset *)contentEditingInput.audiovisualAsset;
        imageURL = asset.URL;
      }
      if (imageURL.absoluteString.length != 0) {
        filePath = [imageURL.absoluteString stringByReplacingOccurrencesOfString:@"pathfile:" withString:@"file:"];
        resolve(filePath);
      } else {
        NSString *errorMessage = [NSString stringWithFormat:@"Failed to load asset"
                                  " with localIdentifier %@ with no error message.", internalId];
        NSError *error = RCTErrorWithMessage(errorMessage);
        reject(@"Error while getting file path",@"Eror while getting file path",error);
      }
    }];
  } else {
    NSString *errorMessage = [NSString stringWithFormat:@"Failed to load asset"
                              " with localIdentifier %@ with no error message.", internalId];
    NSError *error = RCTErrorWithMessage(errorMessage);
    reject(@"No asset found",@"No asset found",error);
  }
}


RCT_EXPORT_METHOD(
        exportImage:(NSURL *)uri
         parameters:(NSDictionary *)parameters
            filters:(NSArray<NSString *> *)filters
             format:(NSString *)format
            quality:(nonnull NSNumber *)quality
            forSize:(CGSize)size
            mask:(NSURL *)maskUri
            backgroundColor:(UIColor *)backgroundColor
            backgroundImageUri:(NSURL *)backgroundImageUri
   backgroundImageTintColor:(UIColor *)backgroundImageTintColor
         backgroundMultiply:(BOOL)backgroundMultiply
            foregroundImageUri:(NSURL *)foregroundImageUri
            foregroundImageTintColor:(UIColor *)foregroundImageTintColor
           resolver:(RCTPromiseResolveBlock)resolve
           rejecter:(RCTPromiseRejectBlock)reject
 ) {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    [AZPEditableImageManager
        exportImageWithUri:uri
                parameters:parameters
                   filters:filters
                    format:format
                   quality:quality
                      size:size
                   maskUri:maskUri
           backgroundColor:backgroundColor
        backgroundImageUri:backgroundImageUri
  backgroundImageTintColor:backgroundImageTintColor
        backgroundMultiply:backgroundMultiply
             foregroundUri:foregroundImageUri
  foregroundImageTintColor:foregroundImageTintColor
         completionHandler:^(NSData * _Nullable data, NSError * _Nullable error) {
      if(error != nil) {
        reject(@"export_failure", @"Could not export", error);
        return;
      }
      
      
      NSString* ext = [format isEqualToString:@"JPEG"]
        ? @"jpeg"
        : @"png";
     
      NSString *filePath =  [AZPMediaHelper getRandomTempFilePath:ext];
      BOOL success = [[NSFileManager defaultManager]
                      createFileAtPath:filePath
                      contents:data
                      attributes:nil];
      if (success) {
        resolve(filePath);
      } else {
        reject(@"export_failure", [NSString stringWithFormat:@"Error %d : %s", errno, strerror(errno)], nil);
      }
    }];

  });
}

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
    NSURL *outputURL = [NSURL fileURLWithPath:[AZPMediaHelper getRandomTempFilePath:@".mp4"]];
    
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
          
          image = [
            image
            imageByApplyingTransform: CGAffineTransformScale(
             CGAffineTransformMakeTranslation(0, image.extent.size.height),
              1, -1
            )
          ];
          
          for (NSString * transformationName in imageTransformations) {
            AZPTransformation transformation = [AZPTransformations imageTransformationForName:transformationName];
            if (transformation != nil) {
              image = transformation(image, parameters);
            }
          }
          
          
          CGFloat scale = request.renderSize.height / image.extent.size.height;
          if (scale != 1) {
            image = [
              image
              imageByApplyingTransform: CGAffineTransformMakeScale(scale, scale)
            ];
          }
          
          image = [
            image
            imageByApplyingTransform: CGAffineTransformScale(
             CGAffineTransformMakeTranslation(0, image.extent.size.height),
              1, -1
            )
          ];
          [request finishWithImage:image context:nil];
        }];
  
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


RCT_EXPORT_METHOD(
  segmentImage:(NSURL *)uri
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
) {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    if (@available(iOS 15.0, *)) {
      CIContext * ciContext = [CIContext contextWithOptions:nil];
      VNGeneratePersonSegmentationRequest *segmentationRequest = [VNGeneratePersonSegmentationRequest new];
      segmentationRequest.qualityLevel = VNGeneratePersonSegmentationRequestQualityLevelAccurate;
      
      #if TARGET_OS_SIMULATOR
      segmentationRequest.usesCPUOnly = true;
      #endif
      
      VNImageRequestHandler *requestHandler = [[VNImageRequestHandler alloc] initWithURL:uri options:@{
        VNImageOptionCIContext: ciContext
      }];
      
      
      NSError * error;
      [requestHandler performRequests:@[segmentationRequest] error:&error];
      if (error) {
        reject(@"failure", @"Error during segmentation", error);
        return;
      }
      if (segmentationRequest.results == nil || segmentationRequest.results.firstObject == nil || segmentationRequest.results.firstObject.pixelBuffer == nil) {
        reject(@"failure", @"No result from segmentation", error);
        return;
      }
      CVPixelBufferRef pixelBuffer = segmentationRequest.results.firstObject.pixelBuffer;
      CIImage *maskImage = [CIImage imageWithCVPixelBuffer:pixelBuffer];
      
      CGColorSpaceRef colorSpaceRGB = CGColorSpaceCreateDeviceRGB();
      NSData* imageData =
        [ciContext
          PNGRepresentationOfImage:maskImage
                            format:kCIFormatBGRA8
                        colorSpace:colorSpaceRGB
                           options:@{}];
      
      NSString *filePath =  [AZPMediaHelper getRandomTempFilePath:@".png"];
      BOOL success = [[NSFileManager defaultManager]
                      createFileAtPath:filePath
                      contents:imageData
                      attributes:nil];
      if (success) {
        resolve(filePath);
      } else {
        reject(@"failure", [NSString stringWithFormat:@"Error %d : %s", errno, strerror(errno)], nil);
      }
    } else {
      reject(@"failure", @"Unsuported OS version", nil);
    }
  });
}

RCT_EXPORT_METHOD(getAvailableFonts:(RCTResponseSenderBlock)callback) {
    NSMutableArray *fontFamilyNames = [[NSMutableArray alloc]init];

    for (NSString *familyName in [UIFont familyNames]){
        [fontFamilyNames addObject:familyName];
    }
 
    callback(@[fontFamilyNames]);
}

+(NSString *)getRandomTempFilePath:(NSString *)ext {
  NSString *fileName = [[NSUUID UUID] UUIDString];
  NSString *filePath =  [[[NSTemporaryDirectory() stringByStandardizingPath] stringByAppendingPathComponent:fileName] stringByAppendingPathExtension:ext];
  return filePath;
}

@end
