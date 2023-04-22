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
  
  @objc
  final func exportViewVideo(
    _ tag: NSNumber,
    size: CGSize,
    bitRate: NSNumber,
    removeSound: Bool,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock) {
    let view = bridge.uiManager.view(forReactTag: tag) as! GPUVideoView
    
    if view.imagesLoadingTask != nil || !view.playerReady {
      reject(GPUViewError.FAILED_TO_EXPORT_CODE, "GPUVideoView is not ready for export", nil)
      return
    }
    guard let gpuLayers = view.gpuLayers, let layersImages = view.layersImages else {
      reject(GPUViewError.FAILED_TO_EXPORT_CODE, "Cannot video from an empty GPUVideoView", nil)
      return
    }
    
    Task.detached {
      await self.exportGPULayers(
        gpuLayers,
        layersImages: layersImages,
        backgroundColor: view.backgroundColor,
        size: size,
        bitRate: bitRate.doubleValue,
        removeSound: removeSound,
        resolve: resolve,
        reject: reject
      )
    }
  }
  
  
  @objc
  final func exportLayers(
    _ layers: NSArray,
    backgroundColor: UIColor?,
    size: CGSize,
    bitRate: NSNumber,
    removeSound: Bool,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock) {
   
    let gpuLayers = GPULayer.fromNSarray(layers)
    Task.detached {
      var layersImages =  [GPULayerSource:CIImage]()
      do {
        try await withThrowingTaskGroup(of: (GPULayerSource, CIImage).self) {
          group in
            for gpuLayer in gpuLayers {
              switch gpuLayer.source {
                case .video:
                  break;
                case .image:
                  fallthrough
                case .videoFrame:
                  let layerSource = gpuLayer.source
                  group.addTask {
                    guard let image = try await GPULayerImageLoader.shared.loadLayerImage(layerSource) else {
                      throw GPUViewError.failedToLoad(layerSource)
                    }
                    return (layerSource, image)
                  }
                  break;
              }
              
              if let maskUri = gpuLayer.maskUri {
                let layerSource = GPULayerSource.image(uri: maskUri)
                group.addTask {
                  guard let image = try await GPULayerImageLoader.shared.loadLayerImage(layerSource) else {
                    throw GPUViewError.failedToLoad(layerSource)
                  }
                  return (layerSource, image)
                }
              }
            }
            for try await (layerSource, image) in group {
              layersImages[layerSource] = image
            }
        }
      } catch {
        if let error = error as? GPUViewError {
          reject(error.code, error.message, error)
        } else {
          reject("UNKNOWN", error.localizedDescription, error)
        }
      }
      self.exportGPULayers(
        gpuLayers,
        layersImages: layersImages,
        backgroundColor: backgroundColor,
        size: size,
        bitRate: bitRate.doubleValue,
        removeSound: removeSound,
        resolve: resolve,
        reject: reject
      )
    }
  }
  
  private final func exportGPULayers(
    _ gpuLayers: [GPULayer],
    layersImages: [GPULayerSource:CIImage],
    backgroundColor: UIColor?,
    size: CGSize,
    bitRate: Double,
    removeSound: Bool,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock) {
    
    let videoLayers = gpuLayers.filter {
      if case .video = $0.source {
        return true
      }
      return false
    }
    
    if videoLayers.count > 1 {
      reject(GPUViewError.FAILED_TO_EXPORT_CODE, "Cannot combine multiple videos", nil)
      return
    }
    
    guard
      let videoLayer = videoLayers.first,
      case .video(uri: let uri, startTime: let startTime, duration: let duration) = videoLayer.source
    else {
      reject(GPUViewError.FAILED_TO_EXPORT_CODE, "Cannot export video without Video Layer", nil)
      return;
    }
    
    let outputUrl = FileUtils.getRanfomFileURL(withExtension: ".mp4")
    
    var outputSize = size;
    if let cropRect = videoLayer.parameters?.cropData {
      if cropRect.width != 0 && cropRect.height != 0 && cropRect.width < size.width {
        outputSize = cropRect.size
      }
    }
    
    let asset = AVURLAsset(url: uri)
    
    guard let videoTrack = asset.tracks(withMediaType: .video).first else {
      reject(GPUViewError.FAILED_TO_EXPORT_CODE, "No video track found in video layer", nil)
      return
    }
    
    // TODO wait for duration loading
    let timeRange = CMTimeRangeMake(start: startTime ?? CMTime.zero, duration: duration ?? asset.duration - (startTime ?? CMTime.zero))
    let videoWriterInput = AVAssetWriterInput(mediaType: AVMediaType.video, outputSettings: [
      AVVideoCodecKey: AVVideoCodecType.h264,
      AVVideoWidthKey: outputSize.width,
      AVVideoHeightKey: outputSize.height,
      AVVideoCompressionPropertiesKey: [
        AVVideoProfileLevelKey: AVVideoProfileLevelH264High41,
        AVVideoMaxKeyFrameIntervalKey: 30,
        AVVideoAverageBitRateKey: bitRate
      ] as [String : Any]
    ])
    videoWriterInput.transform = CGAffineTransformIdentity
    videoWriterInput.expectsMediaDataInRealTime = false
    videoWriterInput.performsMultiPassEncodingIfSupported = true
    
    var writer: AVAssetWriter
    do {
      writer = try AVAssetWriter(url: outputUrl, fileType: AVFileType.mp4)
      // TODO do we need to test canAddInput ??
      writer.add(videoWriterInput)
    } catch {
      reject(GPUViewError.FAILED_TO_EXPORT_CODE, "Could not instanciate AVAssetWriter", error)
      return
    }
    
    let composition = AVMutableVideoComposition(asset: asset, applyingCIFiltersWithHandler: {
      request in
        let videoImage = request.sourceImage
        var layersImages = layersImages
        layersImages[videoLayer.source] = videoImage
          .transformed(by: CGAffineTransform(scaleX: 1, y: -1))
          .transformed(by: CGAffineTransform(translationX: 0, y: videoImage.extent.height))
        
        let size = videoImage.extent.size
        var image: CIImage? = nil
        if let backgroundColor = backgroundColor {
          image = CIImage(color: CIColor(color: backgroundColor))
            .cropped(to: CGRectMake(0, 0, outputSize.width, outputSize.height))
        }
        
        for layer in gpuLayers {
          if let layerImage = GPULayer.draw(layer, withSize: size, onTopOf: image, withImages: layersImages, forMetal: false) {
            image = layerImage
          }
        }
        
        guard var image = image else {
          request.finish(with: videoImage, context: nil)
          return
        }
        image = image
          .transformed(by: CGAffineTransform(scaleX: 1, y: -1))
          .transformed(by: CGAffineTransform(translationX: 0, y: image.extent.height))
          
        request.finish(with: image, context: nil)
    })
    
    let timescale = Int32(ceil(min(30, max(videoTrack.nominalFrameRate, 25))))
    composition.frameDuration = CMTimeMake(value: 1, timescale: timescale)
    
    let videoOutput = AVAssetReaderVideoCompositionOutput(videoTracks: [videoTrack], videoSettings: nil)
    videoOutput.videoComposition = composition
    
    var videoReader: AVAssetReader
    do {
      videoReader = try AVAssetReader(asset: asset)
      // TODO should we use canAddOutput ?
      videoReader.add(videoOutput)
    } catch {
      reject(GPUViewError.FAILED_TO_EXPORT_CODE, "Could not instanciate AVAssetReader", error)
      return
    }
    videoReader.timeRange = timeRange
    
    let audioTrack = asset.tracks(withMediaType: AVMediaType.audio).first
    
    var audioReader: AVAssetReader? = nil
    var audioWriterInput: AVAssetWriterInput? = nil
    var audioOutput: AVAssetReaderTrackOutput? = nil
    
    if let audioTrack = audioTrack, !removeSound {
      // TODO use async load(.formatDescription)
      var formatHint: CMFormatDescription? = nil
      if let format = audioTrack.formatDescriptions.first  {
        formatHint = (format as! CMFormatDescription)
      }
      
      audioWriterInput = AVAssetWriterInput(
        mediaType: AVMediaType.audio,
        outputSettings: nil,
        sourceFormatHint: formatHint
      )
      writer.add(audioWriterInput!)
      
      audioOutput = AVAssetReaderTrackOutput(track: audioTrack, outputSettings: nil)
      do {
        audioReader = try AVAssetReader(asset: asset)
        audioReader!.timeRange = timeRange
        audioReader!.add(audioOutput!)
      } catch {
        reject(GPUViewError.FAILED_TO_EXPORT_CODE, "Could not instanciate AVAssetReader", error)
        return
      }
    }
    
    writer.startWriting()
    videoReader.startReading()
    if let audioReader = audioReader {
      audioReader.startReading()
    }
    writer.startSession(atSourceTime: timeRange.start)
    
      let dispatchQueue = DispatchQueue.global(qos: .default)
    
    videoWriterInput.requestMediaDataWhenReady(on: dispatchQueue) {
      while(videoWriterInput.isReadyForMoreMediaData) {
        if videoReader.status == .completed {
          videoWriterInput.markAsFinished()
          if let audioWriterInput = audioWriterInput, let audioReader = audioReader, let audioOutput = audioOutput {
            audioWriterInput.requestMediaDataWhenReady(on: dispatchQueue) {
              while(audioWriterInput.isReadyForMoreMediaData) {
                if audioReader.status == .completed {
                  audioWriterInput.markAsFinished()
                  writer.finishWriting {
                    resolve(outputUrl.absoluteString)
                  }
                  return;
                } else if audioReader.status == .failed {
                  reject(
                    GPUViewError.FAILED_TO_EXPORT_CODE,
                    "audioReader.status : failed",
                    videoReader.error
                  );
                  return;
                }
                  
                if let sampleBuffer = audioOutput.copyNextSampleBuffer() {
                  audioWriterInput.append(sampleBuffer)
                }
              }
            }
          } else {
            writer.finishWriting {
              resolve(outputUrl.absoluteString)
            }
          }
        } else if videoReader.status == .failed {
          reject(
            GPUViewError.FAILED_TO_EXPORT_CODE,
            "videoReader.status : failed",
            videoReader.error
          );
          return;
        }
        if let sampleBuffer = videoOutput.copyNextSampleBuffer() {
          videoWriterInput.append(sampleBuffer)
        }
      }
    }
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
  var onImagesLoaded: RCTDirectEventBlock?
  
  @objc
  var onError: RCTDirectEventBlock?
  
  @objc
  var paused: ObjCBool = ObjCBool(false) {
    didSet {
      if paused.boolValue  {
        player.pause()
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
  
  internal var layersImages: [GPULayerSource:CIImage]?
  
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
  
  private var player: AVQueuePlayer!
  
  private var playerLayer: AVPlayerLayer!
  
  private var playerObserverContext = 0
  
  private var playerLooper: AVPlayerLooper?
  
  private var playerItem: AVPlayerItem?
  
  internal var playerReady: Bool = false
  
  override init(frame: CGRect) {
    super.init(frame: frame)
    player = AVQueuePlayer()
    player.isMuted = true
    player.allowsExternalPlayback = false
    playerLayer = AVPlayerLayer(player: player)
    playerLayer.frame = self.bounds;
    playerLayer.videoGravity = .resizeAspectFill;
    layer.addSublayer(playerLayer)
    
    player.addObserver(
      self,
      forKeyPath: #keyPath(AVPlayer.status),
      options: [.old, .new],
      context: &playerObserverContext
    )
  }
 
  @available(*, unavailable)
  required init?(coder _: NSCoder) {
    fatalError("init(coder:) is not implemented.")
  }
  
  deinit {
    imagesLoadingTask?.cancel()
    resetPlayerState()
    playerLayer?.removeFromSuperlayer()
    playerLayer = nil
    player.removeObserver(self, forKeyPath: #keyPath(AVPlayer.status), context: &playerObserverContext)
    player = nil
  }
  
  override func layoutSubviews() {
    super.layoutSubviews()
    playerLayer.frame = self.bounds
  }
  
  private func syncLayers() {
    imagesLoadingTask?.cancel()
    imagesLoadingTask = nil
    imageLoadingFailed = false
    guard let gpuLayers = gpuLayers else {
      resetPlayerState()
      return
    }
    
    var layerSourceToLoad: [GPULayerSource] = []
    var loadedLayersImages = [GPULayerSource:CIImage]()
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
    }
    
    if videoSources.isEmpty {
      ReactLogger.log(level: RCTLogLevel.warning, message: "VideoImageView rendered without video layers")
      resetPlayerState()
      return
    } else {
      if videoSources.count > 1 {
        ReactLogger.log(level: RCTLogLevel.warning, message: "VideoImageView cannot combine multiple videos")
      }
      let (url, startTime, duration) = videoSources.first!
      if (url != asset?.url) {
        resetPlayerState()
        asset = AVURLAsset(url: url)
        self.startTime = startTime
        self.duration = duration
        setupPlayerItem()
      } else if startTime != self.startTime || duration != self.duration {
        self.startTime = startTime
        self.duration = duration
        setUpLooper()
      }
    }
    
    if !layerSourceToLoad.isEmpty {
      imagesLoadingTask = Task {
        do {
          player.pause()
          onImagesLoadingStart?(nil)
          try await withThrowingTaskGroup(of: (GPULayerSource, CIImage).self) {
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
    guard let asset = asset else {
      return
    }
    let backgroundColor = self.backgroundColor
    let videoComposition = AVVideoComposition(asset: asset, applyingCIFiltersWithHandler: {
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
        layersImages[videoLayer.source] = videoImage
          .transformed(by: CGAffineTransform(scaleX: 1, y: -1))
          .transformed(by: CGAffineTransform(translationX: 0, y: videoImage.extent.height))
        
        let size = videoImage.extent.size
        var image: CIImage? = nil
        if let backgroundColor = backgroundColor {
          image = CIImage(color: CIColor(color: backgroundColor))
            .cropped(to: CGRectMake(0, 0, size.width, size.height))
        }
        
        if let layers = videoView.gpuLayers {
          for layer in layers {
            if let layerImage = GPULayer.draw(layer, withSize: size, onTopOf: image, withImages: layersImages, forMetal: false) {
              image = layerImage
            }
          }
        }
        
        guard var image = image else {
          request.finish(with: videoImage, context: nil)
          return
        }
        image = image
          .transformed(by: CGAffineTransform(scaleX: 1, y: -1))
          .transformed(by: CGAffineTransform(translationX: 0, y: image.extent.height))
          
        request.finish(with: image, context: nil)
    })
    playerItem = AVPlayerItem(asset: asset)
    playerItem!.videoComposition = videoComposition
    setUpLooper()
  }
  
  private func setUpLooper() {
    guard let playerItem = playerItem else {
      return
    }
    player.removeAllItems()
    playerReady = false
    onPlayerStartBuffing?(nil)
    let startTime = self.startTime ?? CMTime.zero
    let duration = self.duration ?? playerItem.duration - startTime
    playerLooper = AVPlayerLooper(
      player: player,
      templateItem: playerItem,
      timeRange: CMTimeRange(start: startTime, duration: duration)
    )
    startPlayingIfReady()
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
              resetPlayerState()
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
      player.play()
    }
  }
  
  private func resetPlayerState() {
    layersImages = nil
    playerItem = nil
    asset = nil
    playerLooper = nil
    playerReady = false
    startTime = nil
    duration = nil
    player.removeAllItems()
  }
}
