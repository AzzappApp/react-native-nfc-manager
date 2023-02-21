#import <React/RCTBridgeModule.h>
#import <React/RCTConvert.h>
#import <React/RCTViewManager.h>


@interface RCT_EXTERN_MODULE(AZPEditableImageManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary *)
RCT_EXPORT_VIEW_PROPERTY(editionParameters, NSDictionary *)
RCT_EXPORT_VIEW_PROPERTY(backgroundImageColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(backgroundImageTintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(backgroundMultiply, BOOL)
RCT_EXPORT_VIEW_PROPERTY(foregroundImageTintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(filters, NSArray *)
RCT_EXPORT_VIEW_PROPERTY(onLoadStart, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onLoad, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onError, RCTDirectEventBlock)



@end
