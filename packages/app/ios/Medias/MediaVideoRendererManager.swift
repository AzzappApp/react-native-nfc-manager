//
//  MediaVideoRenderer.swift
//  azzapp
//
//  Created by François de Campredon on 03/05/2023.
//

import Foundation
import AVFoundation

@objc(AZPMediaVideoRendererManager)
class MediaVideoRendererManager: RCTViewManager  {
  override var methodQueue: DispatchQueue! {
    return DispatchQueue.main
  }
  
  @objc override static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  override func view() -> UIView! {
    return MediaVideoRenderer()
  }
  
  @objc
  func getPlayerCurrentTime(_ tag: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let view = bridge.uiManager.view(forReactTag: tag) as? MediaVideoRenderer else {
      reject("VIEW_NOT_FOUND", "No MediaVideoRenderer with tag \(tag)", nil)
      return
    }
    
    guard let currentItem = view.player?.currentItem else {
      resolve(["currentTime": 0])
      return
    }
    
    let currentTime = CMTimeGetSeconds(currentItem.currentTime())
    
    resolve(["currentTime": currentTime])
  }
}


struct MediaVideoRendererSource {
  var uri: URL;
  var mediaId: NSString;
  
  static func == (lhs: MediaVideoRendererSource, rhs: MediaVideoRendererSource) -> Bool {
    return lhs.uri == rhs.uri && lhs.mediaId == rhs.mediaId
  }
}


@objc(AZPMediaVideoRenderer)
class MediaVideoRenderer: UIView {
  var _source: MediaVideoRendererSource?
   
  @objc
  var source: NSDictionary? {
    didSet {
      guard let json = source else {
        self._source = nil;
        self.reset()
        return;
      }
      guard
        let uriString = json.object(forKey: "uri") as? NSString,
        let uri =  URL(string: uriString as String),
        let mediaId = json.object(forKey: "mediaId") as? NSString
      else {
        NSLog("invalid source provided %@", json);
        self._source = nil;
        self.reset()
        return;
      }
      let newSource = MediaVideoRendererSource(
        uri: uri,
        mediaId: mediaId
      )
      if let source = _source, newSource == source {
        return;
      }
      _source = newSource;
      self.reset()
      self.loadSource()
    }
  }
  
  @objc
  public var muted: ObjCBool = ObjCBool(false) {
    didSet {
      player?.isMuted = muted.boolValue
    }
  }
  
  @objc
  public var paused: ObjCBool = ObjCBool(false) {
    didSet {
      if paused.boolValue {
        player?.pause()
      } else if player?.status == .readyToPlay {
        player?.play()
      }
    }
  }
  
  @objc
  public var currentTime: NSNumber? = nil
  {
    didSet {
      guard currentTime != oldValue, let currentTime = currentTime else { return }
      player?.seek(to: CMTimeMakeWithSeconds(currentTime.doubleValue, preferredTimescale: 600), completionHandler: { [weak self] success in
        self?.onSeekComplete?(["success": success])
      })
    }
  }
  
  @objc
  public var onLoadingStart: RCTDirectEventBlock?
  
  @objc
  public var onReadyForDisplay: RCTDirectEventBlock?
  
  @objc
  public var onEnd: RCTDirectEventBlock?
  
  @objc
  public var onProgress: RCTDirectEventBlock?
  
  @objc
  public var onSeekComplete: RCTDirectEventBlock?
  
  @objc
  public var onError: RCTDirectEventBlock?
  
  private var playerLayer: AVPlayerLayer!
  
  internal var player: AVPlayer? {
    didSet {
      guard oldValue != player else { return }
      removePlayerObservers(oldValue)
      addPlayerObservers()
    }
  }
  
  private var playerStatusObserver: AnyObject?
  
  private var playerTimeObserver: Any?
  
  private var readyForDisplayObserver: AnyObject?
  
  override required init(frame: CGRect) {
    super.init(frame: frame)
    
    playerLayer = AVPlayerLayer()
    playerLayer.frame = self.bounds
    playerLayer.videoGravity = .resizeAspectFill
    readyForDisplayObserver = playerLayer.observe(\.isReadyForDisplay, changeHandler: { [weak self] _, _ in
      self?.onReadyForDisplay?(nil)
    })
    self.layer.addSublayer(playerLayer)
  }
  
  @available(*, unavailable)
  required init?(coder _: NSCoder) {
    fatalError("init(coder:) is not implemented.")
  }
  
  deinit {
    reset()
  }
  
  override public func layoutSubviews() {
    super.layoutSubviews()

    CATransaction.begin()
    CATransaction.setDisableActions(true)
    playerLayer.frame = bounds
    CATransaction.commit()
  }
  
  
  private func loadSource() {
    guard let source = _source else {
      return
    }
    var asset: AVURLAsset
    if let localUri = MediaURICache.videoCache.getLocaleURI(for: source.mediaId) {
      asset = AVURLAsset(url: localUri)
    } else {
      asset = AVAssetCache.shared.avAsset(for: source.uri) ?? AVURLAsset(url: source.uri)
    }
    
    let playerItem = AVPlayerItem(asset: asset)
    let player = AVQueuePlayer(playerItem: playerItem)
    player.isMuted = self.muted.boolValue
    player.preventsDisplaySleepDuringVideoPlayback = false
    player.allowsExternalPlayback = false
    player.actionAtItemEnd = .none
    player.automaticallyWaitsToMinimizeStalling = false
    
    if let currentTime = currentTime {
      player.seek(to: CMTimeMakeWithSeconds(currentTime.doubleValue, preferredTimescale: 600))
    }
    self.player = player
    playerLayer.player = player
    
    onLoadingStart?([ "uri": source.uri.absoluteString ])
  }
  
  
  private func addPlayerObservers() {
    guard let player = player else { return }
    
    playerStatusObserver = player.observe(\.status, options: [.new, .initial]) {
      [weak self] player, _ in
        Task { @MainActor in
          guard let self = self else {
            return
          }
          if player.status == .readyToPlay {
            if !self.paused.boolValue {
              player.play()
            }
          }
        }
    }
    
    
    NotificationCenter.default.addObserver(self,
      selector: #selector(playerDidPlaytoEndTime),
      name: .AVPlayerItemDidPlayToEndTime,
      object: player.currentItem
    )

  
    playerTimeObserver = player.addPeriodicTimeObserver(forInterval: CMTimeMakeWithSeconds(0.1, preferredTimescale:600), queue: nil, using: {
      [weak self] time in
      guard let self = self else { return }
      guard let currentItem = player.currentItem, currentItem.status == .readyToPlay else {
        return
      }
      let currentTime = CMTimeGetSeconds(currentItem.currentTime())
      if(currentTime >= 0) {
        self.onProgress?(["currentTime": currentTime])
      }
    })
  }
  
  @objc
  private func playerDidPlaytoEndTime() {
    restart()
    onEnd?(nil)
  }
  
  private func removePlayerObservers(_ player: AVPlayer?) {
    guard let player = player else { return }

    playerStatusObserver = nil
    
    NotificationCenter.default.removeObserver(self,
      name: .AVPlayerItemDidPlayToEndTime,
      object: player.currentItem
    )
    
    if let playerTimeObserver = playerTimeObserver {
      player.removeTimeObserver(playerTimeObserver)
    }
  }
  
  public func restart() {
    player?.seek(to: CMTime.zero)
    player?.play()
  }
  
  private func reset() {
    player = nil
    playerLayer.player = nil
  }
}
