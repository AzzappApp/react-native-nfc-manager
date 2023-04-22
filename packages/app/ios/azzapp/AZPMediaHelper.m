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
