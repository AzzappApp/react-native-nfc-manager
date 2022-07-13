//
//  ColorControlFilter.m
//  azzapp
//
//  Created by François de Campredon on 06/07/2022.
//

#import "EditionFilter.h"

@implementation EditionFilter

/*
- (id)applyFilter:(id)inputImage withParameters:(NSDictionary *)parameters {
  
  CIImage *ciImage = inputImage;
  
  NSNumber *brightness = parameters[@"brightness"];
  NSNumber *saturation = parameters[@"saturation"];
  NSNumber *contrast = parameters[@"contrast"];
  
  if (brightness != nil || saturation != nil || contrast != nil) {
    CIFilter *ciColorControlsFilter = [CIFilter filterWithName: @"CIColorControls"];
    [ciColorControlsFilter setValue:ciImage forKey:kCIInputImageKey];
    if (brightness != nil) {
      [ciColorControlsFilter setValue:brightness forKey:kCIInputBrightnessKey];
    }
    if (saturation != nil) {
      [ciColorControlsFilter setValue:saturation forKey:kCIInputSaturationKey];
    }
    if (contrast != nil) {
      [ciColorControlsFilter setValue:contrast forKey:kCIInputContrastKey];
    }
    ciImage = ciColorControlsFilter.outputImage;
  }
    
  NSNumber *shadow = parameters[@"shadow"];
  NSNumber *highlights = parameters[@"highlights"];
  
  if (shadow != nil || highlights != nil) {
    CIFilter *cIHighlightShadowAdjust = [CIFilter filterWithName:@"CIHighlightShadowAdjust"];
    [cIHighlightShadowAdjust setValue:ciImage forKey:kCIInputImageKey];
    if (highlights != nil) {
      [cIHighlightShadowAdjust setValue:highlights forKey:@"inputHighlightAmount"];
    }
    if (shadow != nil) {
      [cIHighlightShadowAdjust setValue:shadow forKey:@"inputShadowAmount"];
    }
    ciImage = cIHighlightShadowAdjust.outputImage;
  }
   
  NSNumber *temperature = parameters[@"temperature"];
  NSNumber *tint = parameters[@"tint"];
  
  if (temperature != nil || tint != nil) {
    CIFilter *ciTemperatureFilter = [CIFilter filterWithName:@"CITemperatureAndTint"];
    
    CGFloat tempFloat = temperature == nil ? 6500 : [temperature floatValue];
    CGFloat tintFloat = tint == nil ? 0 : [tint floatValue];
    
    [ciTemperatureFilter setValue:ciImage forKey:kCIInputImageKey];
    [ciTemperatureFilter setValue:[CIVector vectorWithX:tempFloat Y:0] forKey:@"inputNeutral"];
    [ciTemperatureFilter setValue:[CIVector vectorWithX:6500 Y:tintFloat] forKey:@"inputTargetNeutral"];
    ciImage = ciTemperatureFilter.outputImage;
  }
  
  
 NSNumber *sharpness = parameters[@"sharpness"];
  
  if (sharpness != nil) {
    CIFilter *ciSharpnessFilter = [CIFilter filterWithName:@"CISharpenLuminance"];
    [ciSharpnessFilter setValue:ciImage forKey:kCIInputImageKey];
    [ciSharpnessFilter setValue:sharpness forKey:@"inputSharpness"];
    ciImage = ciSharpnessFilter.outputImage;
  }
  
  NSNumber *structure = parameters[@"structure"];
  if (structure != nil) {
    CIFilter *ciUnsharpMaskFilter = [CIFilter filterWithName:@"CIUnsharpMask"];
    [ciUnsharpMaskFilter setValue:ciImage forKey:kCIInputImageKey];
    [ciUnsharpMaskFilter setValue:structure forKey:@"inputIntensity"];
    ciImage = ciUnsharpMaskFilter.outputImage;
  }
  
  NSNumber *vibrance = parameters[@"vibrance"];
  if (vibrance != nil) {
    CIFilter *ciVibranceFilter = [CIFilter filterWithName:@"CIVibrance"];
    [ciVibranceFilter setValue:ciImage forKey:kCIInputImageKey];
    [ciVibranceFilter setValue:vibrance forKey:@"inputAmount"];
    ciImage = ciVibranceFilter.outputImage;
  }
  
  NSNumber *vigneting = parameters[@"vigneting"];
  if (vigneting != nil) {
    CIFilter *ciVignetteFilter = [CIFilter filterWithName:@"CIVignette"];
    [ciVignetteFilter setValue:ciImage forKey:kCIInputImageKey];
    [ciVignetteFilter setValue:vigneting forKey:@"inputIntensity"];
    ciImage = ciVignetteFilter.outputImage;
  }
  
  return ciImage;
}
*/
@end
