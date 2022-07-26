//
//  AzzappFilteredImage.m
//  azzapp
//
//  Created by François de Campredon on 06/07/2022.
//

#import "AZPMTKImageView.h"
#import "AZPTransformations.h"

@implementation AZPMTKImageView

{
  id<MTLCommandQueue> _commandQueue;
  CGColorSpaceRef _colorSpace;
}


-(instancetype) init {
  if ((self = [super init])) {
    self.enableSetNeedsDisplay = YES;
    self.paused = YES;
    self.opaque = NO;
    self.framebufferOnly = NO;
    self.clearColor = MTLClearColorMake(0, 0, 0, 0);
    self.device = MTLCreateSystemDefaultDevice();
    _commandQueue = [self.device newCommandQueue];
    _colorSpace = CGColorSpaceCreateDeviceRGB();
  }
  return self;
}

-(void)layoutSubviews {
  [super layoutSubviews];
  [self setNeedsDisplay];
}

-(void)drawRect:(CGRect)rect {
  MTLRenderPassDescriptor *renderPassDescriptor = self.currentRenderPassDescriptor;
  id<CAMetalDrawable> currentDrawable = self.currentDrawable;
  
  if (renderPassDescriptor == nil || currentDrawable == nil) {
    return;
  }
  
  id <MTLCommandBuffer> commandBuffer = [_commandQueue commandBuffer];
  id<MTLRenderCommandEncoder> commandEncoder = [commandBuffer
                                                renderCommandEncoderWithDescriptor:renderPassDescriptor];
  [commandEncoder endEncoding];
  
  if (_inputImage != nil) {
    CIImage *image =_inputImage;
    
    #if TARGET_OS_SIMULATOR
      image = [
        image
        imageByApplyingTransform: CGAffineTransformScale(
         CGAffineTransformMakeTranslation(0, image.extent.size.height),
          1, -1
        )
     ];
    #endif
    
    NSMutableDictionary *transormationsParameters = [
      [NSMutableDictionary alloc] initWithDictionary: self.transformationsParameters
    ];
    transormationsParameters[@"outputSize"] = [NSValue valueWithCGSize:self.drawableSize];
    
    if (self.imageTransformations != nil) {
      for (NSString * transformationName in _imageTransformations) {
        AZPTransformation transformation = [AZPTransformations imageTransformationForName:transformationName];
        if (transformation != nil) {
          image = transformation(image, transormationsParameters);
        }
      }
    }
    
    CGRect bounds = CGRectMake(0, 0, self.drawableSize.width, self.drawableSize.height);
    CIContext *ciContext = [AZPMTKImageView getCIContext];
    [ciContext render:image
          toMTLTexture:currentDrawable.texture
         commandBuffer:commandBuffer bounds:bounds colorSpace:_colorSpace];
  }
  
  [commandBuffer presentDrawable:currentDrawable];
  [commandBuffer commit];
}

-(void) setInputImage:(CIImage *)inputImage {
  if (![_inputImage isEqual:inputImage]) {
    _inputImage = inputImage;
    [self setNeedsDisplay];
  }
}

-(void)setImageTransformations:(NSArray<NSString *> *)filters {
  if (![_imageTransformations isEqual:filters]) {
    _imageTransformations = filters;
    [self setNeedsDisplay];
  }
}

-(void)setTransformationsParameters:(NSDictionary *)filtersParameters {
  if (![_transformationsParameters isEqual:filtersParameters]) {
    _transformationsParameters = filtersParameters;
    [self setNeedsDisplay];
  }
}

static CIContext *_ciContext;

+(CIContext *)getCIContext {
  if (_ciContext == nil) {
    _ciContext = [CIContext contextWithOptions:nil];
  }
  return _ciContext;
}

@end
