#ifdef RCT_NEW_ARCH_ENABLED
#import "AzzappRNBufferLoaderSpec.h"

@interface AzzappRNBufferLoader : NSObject <NativeAzzappRNBufferLoaderSpec>
#else
#import <React/RCTBridgeModule.h>

@interface AzzappRNBufferLoader : NSObject <RCTBridgeModule>
#endif

@end
