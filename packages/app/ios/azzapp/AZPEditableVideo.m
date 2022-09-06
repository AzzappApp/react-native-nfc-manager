#import "AZPEditableVideo.h"
#import "AZPTransformations.h"
#import <AVFoundation/AVFoundation.h>

@implementation AZPEditableVideo

{
  AVQueuePlayer *_player;
  AVPlayerLayer *_playerLayer;
  AVPlayerLooper *_playerLooper;
  AVAsset *_asset;
  AVPlayerItem *_item;
}

// TODO should resetLoop and setupCompositon be refactored on the
// boolean invalidate + async execution model (like UIView setNeedDisplay and setNeedsLayout)

-(instancetype) initWithFrame:(CGRect)frame {
  if ((self = [super initWithFrame:frame])) {
    _player = [[AVQueuePlayer alloc] init];
    _playerLayer = [AVPlayerLayer playerLayerWithPlayer:_player];
    _playerLayer.frame = self.bounds;
    _playerLayer.videoGravity = AVVideoScalingModeResizeAspectFill;
    [self.layer addSublayer:_playerLayer];
  }
  return self;
}

- (void)layoutSubviews {
  _playerLayer.frame = self.bounds;
}

-(void)setUri:(NSURL *)uri {
  if (![_uri isEqual:uri]) {
    _uri = uri;
    if (_uri != nil) {
      _asset = [AVURLAsset assetWithURL:_uri];
      _item = [AVPlayerItem playerItemWithAsset:_asset];
      [self setupComposition];
    }
    [self resetLoop];
  }
}

-(void)setupComposition {
  if (_asset != nil) {
    __weak AZPEditableVideo *weakSelf = self;
    AVMutableVideoComposition *composition = [
      AVMutableVideoComposition videoCompositionWithAsset:_asset
                      applyingCIFiltersWithHandler:^(AVAsynchronousCIImageFilteringRequest *request){
            CIImage *image = request.sourceImage;
            AZPEditableVideo *strongSelf = weakSelf;
            if (strongSelf != nil) {
              NSMutableArray<NSString *> *imageTransformations = [
                [NSMutableArray alloc] initWithArray:@[azzappImageEditorTransformationKey]
              ];
              if (self.filters != nil) {
                [imageTransformations addObjectsFromArray:strongSelf.filters];
              }
              
              NSMutableDictionary *parameters = [[NSMutableDictionary alloc] initWithDictionary:strongSelf.editionParameters];
              /* Thoses edition parameters are not supported */
              [parameters removeObjectForKey:@"cropData"];
              [parameters removeObjectForKey:@"orientation"];
              [parameters removeObjectForKey:@"pitch"];
              [parameters removeObjectForKey:@"roll"];
              [parameters removeObjectForKey:@"yaw"];
              
              for (NSString *transformationName in imageTransformations) {
                AZPTransformation transformation = [
                  AZPTransformations
                  imageTransformationForName:transformationName
                ];
                if (transformation != nil) {
                  image = transformation(image, parameters);
                  //image = transformation(image, strongSelf.editionParameters);
                }
              }
              [request finishWithImage:image context:nil];
            }
        }];
    _item.videoComposition = composition;
    [self resetLoop];
  }
}

-(void) setStartTime:(NSNumber *)startTime {
  if(![_startTime isEqual:startTime]) {
    _startTime = startTime;
    [self resetLoop];
  }
}

-(void) setDuration:(NSNumber *)duration {
  if(![_duration isEqual:duration]) {
    _duration = duration;
    [self resetLoop];
  }
}

-(void) resetLoop {
  [_player removeAllItems];
  if (_item) {
    CMTimeRange timeRange = kCMTimeRangeInvalid;
    if (_startTime != nil && _duration != nil) {
      CGFloat startTime = [_startTime floatValue];
      CGFloat duration = [_duration floatValue];
      if (duration > 0 && startTime >= 0) {
        timeRange = CMTimeRangeMake(CMTimeMakeWithSeconds(startTime, 1), CMTimeMakeWithSeconds(duration, 1));
      }
    }
    _playerLooper = [[AVPlayerLooper alloc] initWithPlayer:_player
                                              templateItem:_item
                                                 timeRange:timeRange];
    _player.volume = 0;
    [_player play];
  }
}


- (void)removeFromSuperview {
  [super removeFromSuperview];
  [_playerLayer removeFromSuperlayer];
  [_player pause];
  [_player removeAllItems];
  _player = nil;
  _playerLooper = nil;
  _playerLayer = nil;
  _item = nil;
  _asset = nil;
}

@end
