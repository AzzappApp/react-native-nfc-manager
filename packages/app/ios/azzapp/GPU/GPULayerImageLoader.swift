//
//  CIImageLoader.swift
//  azzapp
//
//  Created by François de Campredon on 05/04/2023.
//

import Foundation
import Nuke
import AVFoundation


class SourceImage {
  private var _ciImage: CIImage?
  private var _uiImage: UIImage?
  
  init(ciImage: CIImage) {
    _ciImage = ciImage
  }
  
  init(uiImage: UIImage) {
    _uiImage = uiImage
  }
  
  var uiImage: UIImage? {
    get {
      return _uiImage
    }
  }
  
  var ciImage: CIImage? {
    get {
      if (_ciImage == nil) {
        if let image = _uiImage {
          _ciImage = CIImage(image: image)?.oriented(CGImagePropertyOrientation(image.imageOrientation));
        }
      }
      return _ciImage
    }
  }
  
  func inverseY() -> SourceImage? {
    guard let image = ciImage else {
      return nil
    }
    return SourceImage(
      ciImage: image
        .transformed(by: CGAffineTransform(scaleX: 1, y: -1))
        .transformed(by: CGAffineTransform(translationX: 0, y: image.extent.height))
    )
  }
}


class GPULayerImageLoader {
  
  static let shared = GPULayerImageLoader()
  
  private class CacheEntry {
    var task: Task<SourceImage?, Error>?
    weak var image: SourceImage?
    
    init(task: Task<SourceImage?, Error>) {
      self.task = task
    }
    
    func setResult(image: SourceImage) {
      self.task = nil
      self.image = image;
    }
  }
  
  private var imageCache = [String: CacheEntry]()
  
  private var cacheDispatchQueue = DispatchQueue(label: "com.azzapp.azzapp.GPULayerImageLoader")
  
  private var cleanTimer: Timer? = nil
  
  deinit {
    cleanTimer?.invalidate()
  }
  
  private func startCleanTimer() {
    DispatchQueue.main.sync {
      guard cleanTimer == nil else { return }

      cleanTimer = Timer.scheduledTimer(
        timeInterval: TimeInterval(60),
        target: self,
        selector: #selector(GPULayerImageLoader.cleanCache),
        userInfo: nil,
        repeats: true
      )
    }
  }
  
  @objc private func cleanCache() {
    cacheDispatchQueue.sync {
      for (key, entry) in imageCache {
        if (entry.image == nil && entry.task == nil) {
          imageCache.removeValue(forKey: key)
        }
      }
    }
  }
  
  private func getCacheEntry(forKey key: String) -> CacheEntry? {
    return cacheDispatchQueue.sync { return imageCache[key] }
  }
  
  private func addCacheEntry(_ entry: CacheEntry, forKey key: String) {
    cacheDispatchQueue.sync { imageCache[key] = entry }
  }
  
  private func removeCacheEntry(forKey key: String) {
    _ = cacheDispatchQueue.sync {
      imageCache.removeValue(forKey: key)
    }
  }
  
  func loadLayerImage(_ layerSource: GPULayerSource) async throws -> SourceImage? {
    var image: SourceImage? = nil
    switch(layerSource) {
      case .image(uri: let uri):
        image = try await loadImage(uri)
        break;
      case .videoFrame(uri: let uri, time: let time):
        image = try await loadImageFromVideo(uri, time: time)
        break;
      case .video(uri: let uri, startTime: let startTime, duration: _):
        ReactLogger.log(
          level: RCTLogLevel.warning,
          message: "Using a Video layer with url '\(uri)' as a static image, use a VideoFrame layer instead"
        )
        image = try await loadImageFromVideo(
          uri,
          time: startTime ?? CMTimeMakeWithSeconds(0, preferredTimescale: 600)
        )
        break;
    }
    return image
  }

  
  private func loadImageIfNotCached(
    key: String,
    loader: @escaping () async throws -> SourceImage?
  ) async throws -> SourceImage? {
    startCleanTimer()
    if let entry = getCacheEntry(forKey: key) {
      if let image = entry.image {
        return image
      }
      if let task = entry.task {
        return try await task.value
      }
    }
    
    let task = Task {
      try await loader()
    }
    let entry = CacheEntry(task: task)
    addCacheEntry(entry, forKey: key)

    do {
      guard let image = try await task.value else {
        removeCacheEntry(forKey: key)
        return nil;
      }
      entry.setResult(image: image)
      return image
    } catch {
      removeCacheEntry(forKey: key)
      throw error
    }
  }
  
  private func loadImage(_ url: URL) async throws -> SourceImage? {
    return try await loadImageIfNotCached(key: url.absoluteString) {
      let image = try await MediaPipeline.pipeline.image(for: url)
      return SourceImage(uiImage: image)
    }
  }
  
  private func loadImageFromVideo(_ url: URL, time: CMTime) async throws -> SourceImage? {
    let key = String(format: "%@-%lld", url.absoluteString, time.value)
    return try await loadImageIfNotCached(key: key) {
      let asset = AVAsset(url: url)
      let generator = AVAssetImageGenerator(asset: asset)
      guard let videoTrack = asset.tracks(withMediaType: .video).first else  {
        throw GPUViewError.noVideoTrack(url: url)
      }
       
      let orientationTransform = videoTrack.orientationTransform
      let task = Task.detached {
        let cgiImage = try generator.copyCGImage(at: time, actualTime: nil)
        var image = CIImage(cgImage: cgiImage);
        image = image.transformed(by: orientationTransform)
        image = image.transformed(by: CGAffineTransform(
          translationX: -image.extent.origin.x,
          y: -image.extent.origin.y
        ))
        return SourceImage(ciImage: image)
      }
      
      return try await task.value
    }
  }
} 
