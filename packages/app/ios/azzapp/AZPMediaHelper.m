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



@end
