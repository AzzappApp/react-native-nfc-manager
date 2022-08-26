//
//  AZPMediaVideoRenderer.m
//  azzapp
//
//  Created by François de Campredon on 24/08/2022.
//

#import "AZPMediaVideoRenderer.h"
#import <AVFoundation/AVFoundation.h>

@implementation AZPMediaVideoRenderer
{
  AVQueuePlayer *_player;
  AVPlayerLooper *_looper;
  AVPlayerLayer *_playerLayer;
  AVURLAsset *_asset;
  AVPlayerItem *_item;
  id _timeObserver;
  BOOL _isReady;
  BOOL _observerAdded;
}

- (void)layoutSubviews {
  if(_playerLayer != nil) {
    _playerLayer.frame = self.bounds;
  }
}

-(void)setUri:(NSURL *)uri {
  if ([_uri isEqual:uri]) {
    return;
  }
  _uri = uri;
  if (_player != nil) {
    [self removeObservers];
    [_player removeAllItems];
    _asset = nil;
    _item = nil;
  }
  _isReady = NO;
  if (_uri != nil) {
    __weak NSURL *loadingURI = _uri;
    __weak AZPMediaVideoRenderer *weakSelf = self;
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
      AZPMediaVideoRenderer *strongSelf = weakSelf;
      if (strongSelf == nil || ![strongSelf.uri isEqual:loadingURI]) {
        return;
      }
      [strongSelf loadAssetAsynchronously];
    });
  }
}

-(void)setMuted:(BOOL)muted {
  _muted = muted;
  if (_player != nil) {
    _player.muted = _muted;
  }
}

-(void)setPaused:(BOOL)paused {
  _paused = paused;
  if (_isReady) {
    if (_paused) {
      [_player pause];
    } else {
      [_player play];
    }
  }
}

- (void)setCurrentTime:(NSNumber *)currentTime {
  if ([currentTime isEqual:_currentTime]) {
    return;
  }
  _currentTime = currentTime;
  if (_isReady && _currentTime != nil) {
    [self seekToCurrentTime:nil];
  }
}

-(CGFloat)getPlayerCurrentTime {
  if (_player == nil) {
    return 0;
  }
  AVPlayerItem *currentItem = [_player currentItem];
  if (currentItem != nil && currentItem.status != AVPlayerItemStatusReadyToPlay) {
    return 0;
  }

  CMTime currentTime = currentItem.currentTime;
  return CMTimeGetSeconds(currentTime);
}

-(void)loadAssetAsynchronously {
  _asset = [AVURLAsset assetWithURL:_uri];
  __weak AZPMediaVideoRenderer *weakSelf = self;
  __weak NSURL *loadedUri = _uri;
  [_asset loadValuesAsynchronouslyForKeys:@[@"playable"] completionHandler:^{
    AZPMediaVideoRenderer *strongSelf = weakSelf;
    if (strongSelf == nil) {
      return;
    }
    AVURLAsset *asset = strongSelf->_asset;
    if (asset == nil || ![strongSelf.uri isEqual:loadedUri]) {
      return;
    }
    if (!asset.playable) {
      // TODO handle error
      return;
    }
    
    dispatch_async(dispatch_get_main_queue(), ^{ [strongSelf setupPlayer]; });
  }];
}

-(void)setupPlayer {
  if(!_player) {
    _player = [[AVQueuePlayer alloc] init];
    _playerLayer = [AVPlayerLayer playerLayerWithPlayer:_player];
    _playerLayer.frame = self.bounds;
    _playerLayer.videoGravity = AVVideoScalingModeResizeAspectFill;
    [self.layer addSublayer:_playerLayer];
  }
  [self addObservers];
  _item = [AVPlayerItem playerItemWithAsset:_asset];
  _looper = [[AVPlayerLooper alloc] initWithPlayer:_player
                                      templateItem:_item
                                         timeRange:kCMTimeRangeInvalid];
  [_player pause];
  if (_muted) {
    _player.muted = true;
  } else {
    _player.muted = false;
  }
  _player.allowsExternalPlayback = false;
}

-(void)addObservers {
  [_playerLayer addObserver:self forKeyPath:@"readyForDisplay" options:NSKeyValueObservingOptionNew context:nil];
  __weak AZPMediaVideoRenderer *weakSelf = self;
  _timeObserver = [_player
    addPeriodicTimeObserverForInterval:CMTimeMakeWithSeconds(0.1, NSEC_PER_SEC)
    queue:NULL usingBlock:^(CMTime time){
    if (weakSelf != nil) {
      [weakSelf sendProgressUpdate];
    }
  }];
  [_player addObserver:self forKeyPath:@"currentItem" options:NSKeyValueObservingOptionOld context:nil];
  _observerAdded = YES;
}

-(void)removeObservers {
  if (!_observerAdded) {
    return;
  }
  if (_playerLayer) {
    [_playerLayer removeObserver:self forKeyPath:@"readyForDisplay" context:nil];
  }
  if (_player) {
    [_player removeObserver:self forKeyPath:@"currentItem" context:nil];
    if (_timeObserver) {
      [_player removeTimeObserver:_timeObserver];
      _timeObserver = nil;
    }
  }
  _observerAdded = NO;
}

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary *)change
                       context:(void *)context {
  if (!_isReady && [keyPath isEqualToString:@"readyForDisplay"] && [change objectForKey:NSKeyValueChangeNewKey]) {
    if (_currentTime != nil && ![_currentTime isEqual:@(0)]) {
      __weak NSURL *loadingURI = _uri;
      __weak AZPMediaVideoRenderer *weakSelf = self;
      [self seekToCurrentTime:^(BOOL finished) {
        AZPMediaVideoRenderer *strongSelf = weakSelf;
        if (strongSelf == nil || ![strongSelf.uri isEqual:loadingURI]) {
          return;
        }
        [strongSelf onReady];
      }];
    } else {
      [self onReady];
    }
    return;
  } else if ([keyPath isEqualToString:@"currentItem"] && self.onEnd) {
    AVPlayerItem *item = [change objectForKey:NSKeyValueChangeOldKey];
    if (item != nil && ![item isEqual:[NSNull null]]) {
      self.onEnd(nil);
    }
  }
}

- (void)onReady {
  if (self.onReadyForDisplay) {
    self.onReadyForDisplay(nil);
  }
  _isReady = YES;
  if (!_paused) {
    [_player play];
  } else {
    [_player pause];
  }
}

- (void)sendProgressUpdate {
  if (!self.onProgress) {
    return;;
  }
  AVPlayerItem *currentItem = [_player currentItem];
  if (currentItem == nil || currentItem.status != AVPlayerItemStatusReadyToPlay) {
    return;
  }
  CMTime currentTime = currentItem.currentTime;
  CGFloat currentTimeSecs = CMTimeGetSeconds(currentTime);
  
  if(currentTimeSecs >= 0) {
    self.onProgress(@{
      @"currentTime": [NSNumber numberWithFloat:currentTimeSecs]
    });
  }
}

-(void) seekToCurrentTime:(void (^)(BOOL finished))completionHandler {
  CGFloat currentTimeFloat = [_currentTime floatValue];
  CGFloat playerTime = CMTimeGetSeconds(_player.currentTime);
  if (ABS(playerTime - currentTimeFloat) < 0.1) {
    return;
  }
  CMTime seekedTime = CMTimeMakeWithSeconds([_currentTime floatValue], NSEC_PER_SEC);
  [_player seekToTime:seekedTime completionHandler:completionHandler];
}

- (void)removeFromSuperview {
  [super removeFromSuperview];
  [self removeObservers];
  if (_playerLayer != nil) {
    [_playerLayer removeFromSuperlayer];
    _playerLayer = nil;
  }
  if (_player != nil) {
    [_player pause];
    [_player removeAllItems];
    _looper = nil;
    _player = nil;
  }
  _item = nil;
  _asset = nil;
}


@end
