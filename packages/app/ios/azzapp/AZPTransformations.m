//
//  AzzappFilters.m
//  azzapp
//
//  Created by François de Campredon on 07/07/2022.
//

#import "AZPTransformations.h"
#import <UIKit/UIKit.h>

@implementation AZPTransformations

static NSMutableDictionary<NSString*, AZPTransformation> *filtersRegistry;

+(AZPTransformation)imageTransformationForName:(NSString *)name {
  if (filtersRegistry == nil) {
    [AZPTransformations initRegistry];
  }
  return filtersRegistry[name];
}

+(void)registerImageTransformation:(AZPTransformation)filter forName:(NSString *)name {
  if (filtersRegistry == nil) {
    [AZPTransformations initRegistry];
  }
  filtersRegistry[name] = filter;
}

+(void) initRegistry {
  filtersRegistry = [[NSMutableDictionary alloc] initWithDictionary:@{
    azzappImageEditorTransformationKey:
      ^CIImage *(CIImage *inputImage, NSDictionary *parameters) {
        return [self editorTransformation:inputImage withParameters:parameters];
      },
    @"chrome":
      ^CIImage *(CIImage *inputImage, NSDictionary *parameters) {
        return [self applyFilterTransform:@"CIPhotoEffectChrome" onImage:inputImage];
      },
    @"fade":
      ^CIImage *(CIImage *inputImage, NSDictionary *parameters) {
        return [self applyFilterTransform:@"CIPhotoEffectFade" onImage:inputImage];
      },
    @"instant":
      ^CIImage *(CIImage *inputImage, NSDictionary *parameters) {
        return [self applyFilterTransform:@"CIPhotoEffectInstant" onImage:inputImage];
      },
    @"noir":
      ^CIImage *(CIImage *inputImage, NSDictionary *parameters) {
        return [self applyFilterTransform:@"CIPhotoEffectNoir" onImage:inputImage];
      },
    @"process":
      ^CIImage *(CIImage *inputImage, NSDictionary *parameters) {
        return [self applyFilterTransform:@"CIPhotoEffectProcess" onImage:inputImage];
      },
    @"tonal":
      ^CIImage *(CIImage *inputImage, NSDictionary *parameters) {
        return [self applyFilterTransform:@"CIPhotoEffectTonal" onImage:inputImage];
      },
    @"transfer":
      ^CIImage *(CIImage *inputImage, NSDictionary *parameters) {
        return [self applyFilterTransform:@"CIPhotoEffectTransfer" onImage:inputImage];
      },
    @"sepia":
      ^CIImage *(CIImage *inputImage, NSDictionary *parameters) {
        return [self sepiaTransform:inputImage];
      },
    @"thermal":
      ^CIImage *(CIImage *inputImage, NSDictionary *parameters) {
        return [self applyFilterTransform:@"CIThermal" onImage:inputImage];
      },
    @"xray":
      ^CIImage *(CIImage *inputImage, NSDictionary *parameters) {
        return [self applyFilterTransform:@"CIXRay" onImage:inputImage];
      }
    
  }];
  
  
}

+(CIImage *)editorTransformation:(CIImage *)inputImage
                  withParameters:(NSDictionary *)parameters {
  
  
  CIImage *image = inputImage;
  
  
  NSString *orientation = parameters[@"orientation"];
  if (orientation != nil) {
    int exifOrientation = 1;
    if ([orientation isEqualToString:@"UP"]) {
      exifOrientation = 1;
    } else if ([orientation isEqualToString:@"RIGHT"]) {
      exifOrientation = 8;
    } else if ([orientation isEqualToString:@"DOWN"]) {
      exifOrientation = 3;
    } else if ([orientation isEqualToString:@"LEFT"]) {
      exifOrientation = 6;
    }
    image = [image imageByApplyingOrientation:exifOrientation];
  }
  
  
  NSNumber *pitch = parameters[@"pitch"];
  NSNumber *roll = parameters[@"roll"];
  NSNumber *yaw = parameters[@"yaw"];
  
  if (pitch != nil || roll != nil || yaw != nil) {
    CIFilter *ciPerspectiveRotateFilter = [CIFilter filterWithName:@"CIPerspectiveRotate"];
    
    [ciPerspectiveRotateFilter setValue:image forKey:kCIInputImageKey];
    [ciPerspectiveRotateFilter setValue:[self degToRad: pitch] forKey:@"inputPitch"];
    [ciPerspectiveRotateFilter setValue:[self degToRad: roll] forKey:@"inputRoll"];
    [ciPerspectiveRotateFilter setValue:[self degToRad: yaw] forKey:@"inputYaw"];
    
    image = ciPerspectiveRotateFilter.outputImage;
    image = [image imageByApplyingTransform:
               CGAffineTransformMakeTranslation(-image.extent.origin.x, -image.extent.origin.y)];
  }
  
  NSDictionary *cropData = parameters[@"cropData"];
  
  if (cropData != nil) {
    NSNumber *originX = cropData[@"originX"];
    NSNumber *originY = cropData[@"originY"];
    NSNumber *width = cropData[@"width"];
    NSNumber *height = cropData[@"height"];
    
    
    CGRect cropRect = CGRectMake(
      [originX floatValue],
      [originY floatValue],
      [width floatValue],
      [height floatValue]
    );
    
    image = [image imageByCroppingToRect:cropRect];
    image = [image imageByApplyingTransform:
               CGAffineTransformMakeTranslation(-cropRect.origin.x, -cropRect.origin.y)];
  }
  
  NSValue *size = parameters[@"outputSize"];
  if (size != nil) {
    // TODO implement contain,cover, fill etc
    float scale = size.CGSizeValue.width / image.extent.size.width;
    image = [image imageByApplyingTransform:CGAffineTransformMakeScale(scale, scale)];
  }
  
  NSNumber *brightness = parameters[@"brightness"];
  NSNumber *saturation = parameters[@"saturation"];
  NSNumber *contrast = parameters[@"contrast"];
  
  if (brightness != nil || saturation != nil || contrast != nil) {
    CIFilter *ciColorControlsFilter = [CIFilter filterWithName: @"CIColorControls"];
    [ciColorControlsFilter setValue:image forKey:kCIInputImageKey];
    if (brightness != nil) {
      [ciColorControlsFilter setValue:brightness forKey:kCIInputBrightnessKey];
    }
    if (saturation != nil) {
      [ciColorControlsFilter setValue:saturation forKey:kCIInputSaturationKey];
    }
    if (contrast != nil) {
      [ciColorControlsFilter setValue:contrast forKey:kCIInputContrastKey];
    }
    image = ciColorControlsFilter.outputImage;
  }
    
  NSNumber *shadow = parameters[@"shadow"];
  NSNumber *highlights = parameters[@"highlights"];
  
  if (shadow != nil || highlights != nil) {
    CIFilter *cIHighlightShadowAdjust = [CIFilter filterWithName:@"CIHighlightShadowAdjust"];
    [cIHighlightShadowAdjust setValue:image forKey:kCIInputImageKey];
    if (highlights != nil) {
      [cIHighlightShadowAdjust setValue:highlights forKey:@"inputHighlightAmount"];
    }
    if (shadow != nil) {
      [cIHighlightShadowAdjust setValue:shadow forKey:@"inputShadowAmount"];
    }
    image = cIHighlightShadowAdjust.outputImage;
  }
   
  NSNumber *temperature = parameters[@"temperature"];
  NSNumber *tint = parameters[@"tint"];
  
  if (temperature != nil || tint != nil) {
    CIFilter *ciTemperatureFilter = [CIFilter filterWithName:@"CITemperatureAndTint"];
    
    CGFloat tempFloat = temperature == nil ? 6500 : [temperature floatValue];
    CGFloat tintFloat = tint == nil ? 0 : [tint floatValue];
    
    [ciTemperatureFilter setValue:image forKey:kCIInputImageKey];
    [ciTemperatureFilter setValue:[CIVector vectorWithX:tempFloat Y:0] forKey:@"inputNeutral"];
    [ciTemperatureFilter setValue:[CIVector vectorWithX:6500 Y:tintFloat] forKey:@"inputTargetNeutral"];
    image = ciTemperatureFilter.outputImage;
  }
  
  
 NSNumber *sharpness = parameters[@"sharpness"];
  
  if (sharpness != nil) {
    CIFilter *ciSharpnessFilter = [CIFilter filterWithName:@"CISharpenLuminance"];
    [ciSharpnessFilter setValue:image forKey:kCIInputImageKey];
    [ciSharpnessFilter setValue:sharpness forKey:@"inputSharpness"];
    image = ciSharpnessFilter.outputImage;
  }
  
  NSNumber *structure = parameters[@"structure"];
  if (structure != nil) {
    CIFilter *ciUnsharpMaskFilter = [CIFilter filterWithName:@"CIUnsharpMask"];
    [ciUnsharpMaskFilter setValue:image forKey:kCIInputImageKey];
    [ciUnsharpMaskFilter setValue:structure forKey:@"inputIntensity"];
    image = ciUnsharpMaskFilter.outputImage;
  }
  
  NSNumber *vibrance = parameters[@"vibrance"];
  if (vibrance != nil) {
    CIFilter *ciVibranceFilter = [CIFilter filterWithName:@"CIVibrance"];
    [ciVibranceFilter setValue:image forKey:kCIInputImageKey];
    [ciVibranceFilter setValue:vibrance forKey:@"inputAmount"];
    image = ciVibranceFilter.outputImage;
  }
  
  NSNumber *vigneting = parameters[@"vigneting"];
  if (vigneting != nil) {
    CIFilter *ciVignetteFilter = [CIFilter filterWithName:@"CIVignette"];
    [ciVignetteFilter setValue:image forKey:kCIInputImageKey];
    [ciVignetteFilter setValue:vigneting forKey:@"inputIntensity"];
    image = ciVignetteFilter.outputImage;
  }
  
  return image;
}


+(CIImage *)applyFilterTransform:(NSString *)filterName onImage:(CIImage *)inputImage {
  CIFilter *filter = [CIFilter filterWithName:filterName];
  [filter setValue:inputImage forKey:kCIInputImageKey];
  return filter.outputImage;
}

+(CIImage *)sepiaTransform:(CIImage *)inputImage {
  CIFilter *filter = [CIFilter filterWithName:@"CISepiaTone"];
  [filter setValue:inputImage forKey:kCIInputImageKey];
  [filter setValue:@1.0 forKey:@"inputIntensity"];
  return filter.outputImage;
}


+(NSNumber *) degToRad: (NSNumber *)deg {
  if (deg == nil) {
    return nil;
  }
  return [[NSNumber alloc] initWithFloat:(deg.floatValue * M_PI / 180.0)];
}


@end
