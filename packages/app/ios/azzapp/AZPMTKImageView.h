//
//  AzzappFilteredImage.h
//  azzapp
//
//  Created by François de Campredon on 06/07/2022.
//

#import <MetalKit/MetalKit.h>

@interface AZPMTKImageView : MTKView

@property (nonatomic, retain) NSArray<NSString *> *imageTransformations;

@property (nonatomic, retain) NSDictionary *transformationsParameters;

@property (nonatomic, retain) CIImage *inputImage;

@end
