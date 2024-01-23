//
//  GPUVideoView.swift
//  azzapp
//
//  Created by François de Campredon on 12/04/2023.
//

import Foundation
import AVFoundation

@objc(AZPGPUVideoViewManager)
class GPUVideoViewManager: RCTViewManager {
  override func view() -> UIView! {
    return GPUVideoView()
  }
  
  override var methodQueue: DispatchQueue! {
    return DispatchQueue.main
  }
  
  @objc override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}

@objc(AZPGPUVideoView)
class GPUVideoView: UIView {
  private static let ciContext = CIContext()
  
  @objc
  var onImagesLoadingStart: RCTDirectEventBlock?
  
  @objc
  var onPlayerStartBuffing: RCTDirectEventBlock?
  
  @objc
  var onPlayerReady: RCTDirectEventBlock?
  
  @objc
  public var onProgress: RCTDirectEventBlock?

  @objc
  var onImagesLoaded: RCTDirectEventBlock?
  
  @objc
  var onError: RCTDirectEventBlock?
  
  @objc
  var paused: ObjCBool = ObjCBool(false) {
    didSet {
      if paused.boolValue  {
        player?.pause()
      } else {
        startPlayingIfReady()
      }
    }
  }
  
  @objc
  var layers: NSArray? {
    didSet {
      guard let layers = layers else {
        gpuLayers = nil
        return
      }
      self.gpuLayers = GPULayer.fromNSarray(layers)
    }
  }
  
  internal var backgroundColorCopy: UIColor?
  
  override var backgroundColor: UIColor? {
    didSet {
      self.backgroundColorCopy = backgroundColor
    }
  }
  
  internal var layersImages: [GPULayerSource:SourceImage]?
  
  internal var imagesLoadingTask: Task<Void, Never>?
  
  internal var imageLoadingFailed: Bool = false
  
  internal var asset: AVURLAsset?
  
  internal var startTime: CMTime?
  
  internal var duration: CMTime?
  
  internal var gpuLayers: [GPULayer]? {
    didSet {
      syncLayers()
    }
  }
  
  private var player: AVQueuePlayer? = nil
  
  private var playerLayer: AVPlayerLayer!
  
  private var playerObserverContext = 0
  
  private var playerLooper: AVPlayerLooper?
  
  private var playerItem: AVPlayerItem?
  
  internal var playerReady: Bool = false
  
  override required init(frame: CGRect) {
    super.init(frame: frame)
    
    playerLayer = AVPlayerLayer()
    playerLayer.frame = self.bounds
    playerLayer.videoGravity = .resizeAspectFill
    self.layer.addSublayer(playerLayer)
  }
  
  @available(*, unavailable)
  required init?(coder _: NSCoder) {
    fatalError("init(coder:) is not implemented.")
  }
  
  deinit {
    reset()
  }
  
  override func layoutSubviews() {
    super.layoutSubviews()

    CATransaction.begin()
    CATransaction.setDisableActions(true)
    playerLayer.frame = bounds
    CATransaction.commit()
    // TODO we reset player item here since updating afterwards video composition size
    // seems to have no effect however it would be cleaner to find a way to do so
    setupPlayerItem()
  }
  
  private func syncLayers() {
    guard let gpuLayers = gpuLayers else {
      reset()
      return
    }
    
    var layerSourceToLoad: [GPULayerSource] = []
    var loadedLayersImages = [GPULayerSource:SourceImage]()
    var videoSources: [(URL, CMTime?, CMTime?)] = []
    for gpuLayer in gpuLayers {
      switch gpuLayer.source {
        case .video(uri: let uri, startTime:let startTime, duration: let duration):
          videoSources.append((uri, startTime, duration))
        default:
          if let image = layersImages?[gpuLayer.source] {
            loadedLayersImages[gpuLayer.source] = image
          } else {
            layerSourceToLoad.append(gpuLayer.source)
          }
        break;
      }
      if let maskUri = gpuLayer.maskUri {
        let source = GPULayerSource.image(uri: maskUri)
        if let image = layersImages?[source] {
          loadedLayersImages[source] = image
        } else {
          layerSourceToLoad.append(source)
        }
      }
      if let lutFilterUri = gpuLayer.lutFilterUri {
        let source = GPULayerSource.image(uri: lutFilterUri)
        if let image = layersImages?[source] {
          loadedLayersImages[source] = image
        } else {
          layerSourceToLoad.append(source)
        }
      }
    }
    
    if videoSources.isEmpty {
      ReactLogger.log(level: RCTLogLevel.warning, message: "VideoImageView rendered without video layers")
      reset()
      return
    } else {
      if videoSources.count > 1 {
        ReactLogger.log(level: RCTLogLevel.warning, message: "VideoImageView cannot combine multiple videos")
      }
      let (url, startTime, duration) = videoSources.first!
      if (url != asset?.url) {
        reset()
        asset = AVAssetCache.shared.avAsset(for: url) ?? AVURLAsset(url: url)
        self.startTime = startTime
        self.duration = duration
        setupPlayerItem()
      } else if startTime != self.startTime || duration != self.duration {
        self.startTime = startTime
        self.duration = duration
        setUpPlayer()
      }
    }
    
    imagesLoadingTask?.cancel()
    imagesLoadingTask = nil
    imageLoadingFailed = false
    if !layerSourceToLoad.isEmpty {
      imagesLoadingTask = Task {
        do {
          player?.pause()
          onImagesLoadingStart?(nil)
          try await withThrowingTaskGroup(of: (GPULayerSource, SourceImage).self) {
            group in
              for layerSource in layerSourceToLoad {
                group.addTask {
                  guard let image = try await GPULayerImageLoader.shared.loadLayerImage(layerSource) else {
                    throw GPUViewError.failedToLoad(layerSource)
                  }
                  return (layerSource, image)
                }
              }
              for try await (layerSource, image) in group {
                loadedLayersImages[layerSource] = image
              }
          }
          layersImages = loadedLayersImages
          onImagesLoaded?(nil)
        } catch {
          if !(error is CancellationError) {
            if let error = error as? GPUViewError {
              onError?([
                "code": error.code,
                "message": error.message
              ])
            } else {
              onError?([
                "code": GPUViewError.UNKNOWN_ERROR_CODE,
                "message": error.localizedDescription
              ])
            }
          }
          imageLoadingFailed = true
          imagesLoadingTask = nil;
          return;
        }
        imagesLoadingTask = nil
        startPlayingIfReady()
      }
    } else {
      layersImages = loadedLayersImages
    }
  }
  
  private func setupPlayerItem() {
    DispatchQueue.main.async { [weak self] in
      guard let self = self, let asset = asset  else {
        return
      }
      let width = self.bounds.width
      let height = self.bounds.height
      if width == 0 || height == 0 {
        return
      }
      let videoComposition = AVMutableVideoComposition(asset: asset, applyingCIFiltersWithHandler: {
        [weak self] request in
          let videoImage = request.sourceImage
          guard let videoView = self else {
            request.finish(with: videoImage, context: nil)
            return
          }
          guard let videoLayer = videoView.gpuLayers?.first(where: {
            if case .video = $0.source {
              return true
            }
            return false
          }) else {
            request.finish(with: videoImage, context: nil)
            return
          }
        
          var layersImages = videoView.layersImages ?? [:]
          layersImages[videoLayer.source] = SourceImage(ciImage: videoImage)
          
          let size = request.renderSize
          var image: CIImage? = nil
          if let backgroundColor = videoView.backgroundColorCopy {
            image = CIImage(color: CIColor(color: backgroundColor))
              .cropped(to: CGRectMake(0, 0, size.width, size.height))
          }
          
          if let layers = videoView.gpuLayers {
            for layer in layers {
              if let layerImage = GPULayer.draw(
                layer,
                withSize: size,
                onTopOf: image,
                withImages: layersImages
              ) {
                image = layerImage
              }
            }
          }
          
          guard let image = image else {
            request.finish(with: videoImage, context: nil)
            return
          }
            
          request.finish(with: image, context: nil)
      })
      let pixelRatio = UIScreen.main.scale
      videoComposition.renderSize = CGSize(
        width: width * pixelRatio,
        height: height * pixelRatio
      )
      playerItem = AVPlayerItem(asset: asset)
      playerItem!.videoComposition = videoComposition
      setUpPlayer()
    }
  }
  
  
  private var playerTimeObserver: Any?
  
  private func setUpPlayer() {
    DispatchQueue.main.async { [weak self] in
      guard let self = self, let playerItem = playerItem else {
        return
      }
      resetPlayer()
      onPlayerStartBuffing?(nil)
      
      let player = AVQueuePlayer()
      player.isMuted = true
      player.allowsExternalPlayback = false
      player.addObserver(
        self,
        forKeyPath: #keyPath(AVPlayer.status),
        options: [.old, .new],
        context: &playerObserverContext
      )
      playerTimeObserver = player.addPeriodicTimeObserver(forInterval: CMTimeMakeWithSeconds(0.1, preferredTimescale:600), queue: nil, using: {
        [weak self] time in
        guard let self = self else { return }
        guard let currentItem = player.currentItem, currentItem.status == .readyToPlay else {
          return
        }
        let currentTime = CMTimeGetSeconds(currentItem.currentTime())
        if(currentTime >= 0) {
          self.onProgress?(["currentTime": currentTime, "duration": CMTimeGetSeconds(currentItem.duration)])
        }
      })
      
      self.player = player
      self.playerLayer?.player = player
      
      
      var timerange = CMTimeRange.invalid
      if let startTime = self.startTime, let duration = self.duration  {
        timerange = CMTimeRange(start: startTime, duration: duration)
      }
      playerLooper = AVPlayerLooper(
        player: player,
        templateItem: playerItem,
        timeRange: timerange
      )
      startPlayingIfReady()
    }
  }
  
  override func observeValue(
    forKeyPath keyPath: String?,
    of object: Any?,
    change: [NSKeyValueChangeKey : Any]?,
    context: UnsafeMutableRawPointer?
  ) {
      guard context == &playerObserverContext else {
        super.observeValue(
          forKeyPath: keyPath,
          of: object,
          change: change,
          context: context
        )
        return
      }

      if keyPath == #keyPath(AVPlayer.status) {
          let status: AVPlayer.Status
          if let statusNumber = change?[.newKey] as? NSNumber {
              status = AVPlayer.Status(rawValue: statusNumber.intValue)!
          } else {
              status = .unknown
          }
          
          let oldStatus: AVPlayer.Status
          if let statusNumber = change?[.oldKey] as? NSNumber {
              oldStatus = AVPlayer.Status(rawValue: statusNumber.intValue)!
          } else {
              oldStatus = .unknown
          }
          
          if (oldStatus == status) {
            return
          }
          
          switch status {
            case .readyToPlay:
              onPlayerReady?(nil)
              playerReady = true
              startPlayingIfReady()
              return;
            case .failed:
              if let playerError = player?.error as? NSError {
                onError?([
                  "code": GPUViewError.PLAYER_ERROR_CODE,
                  "message": playerError.localizedDescription,
                  "cause": [
                    "code": playerError.code,
                    "domain": playerError.domain,
                    "message": playerError.description,
                    "details": playerError.userInfo,
                  ] as [String : Any]
                ])
              } else {
                onError?([ "code": GPUViewError.UNKNOWN_ERROR_CODE, "message": "unknown"])
              }
              reset()
              return;
            default:
              return
          }
      }
  }
  
  private func startPlayingIfReady() {
    if !playerReady || imagesLoadingTask != nil || imageLoadingFailed != false {
      return
    }
    if (!paused.boolValue) {
      player?.play()
    }
  }
  
  private func reset() {
    resetPlayer()
    imagesLoadingTask?.cancel()
    imagesLoadingTask = nil
    layersImages = nil
    playerItem = nil
    asset = nil
    startTime = nil
    duration = nil
  }
  
  private func resetPlayer() {
    playerLooper = nil
    playerReady = false
    if let player = player {
       if let playerTimeObserver = playerTimeObserver {
        player.removeTimeObserver(playerTimeObserver)
      }
      player.removeAllItems()
      player.removeObserver(self, forKeyPath: #keyPath(AVPlayer.status), context: &playerObserverContext)
      self.player = nil
    }
    playerLayer.player = nil
  }
}
