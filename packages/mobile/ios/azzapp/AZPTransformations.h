//
//  AzzappFilters.h
//  azzapp
//
//  Created by François de Campredon on 07/07/2022.
//

#import <Foundation/Foundation.h>
#import <CoreImage/CoreImage.h>


typedef CIImage* (^AZPTransformation)(CIImage *, NSDictionary *);

static const NSString *azzappImageEditorTransformationKey = @"AzzappImageEditorTransformation";

@interface AZPTransformations : NSObject

+(AZPTransformation)imageTransformationForName:(NSString *) name;

+(void) registerImageTransformation:(AZPTransformation)filter
                           forName:(NSString *)name;


@end
