//
//  MediaPrefetcher.swift
//  azzapp
//
//  Created by François de Campredon on 04/05/2023.
//

import Foundation
import Nuke
import AVFoundation
import Photos
import Vision
import CoreImage
import UIKit


@objc(AZPMediaHelpers)
class MediaHelpers: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func getVideoSize(_ uri: NSURL, resolve: @escaping RCTPromiseResolveBlock, reject:  @escaping RCTPromiseRejectBlock) {
    let asset = AVURLAsset(url: uri as URL)
    Task.detached {
      do {
        let tracks = try await asset.loadTracks(withMediaType: .video);
        guard let track = tracks.first else {
          reject("FAILURE", "No video track", nil);
          return
        }
        let size = try await track.load(.naturalSize);
        var width = size.width;
        var height = size.height;
        let transform = try await track.load(.preferredTransform);
        var rotation = round(atan2(transform.b, transform.a) * 180 / .pi);
        if (rotation < 0) {
          rotation += 360;
        }
        if (rotation == 90 || rotation == 270) {
          width = size.height;
          height = size.width;
        }
        resolve(["width": width, "height": height, "rotation": rotation]);
      } catch {
        reject("FAILURE", "Failed to retrieve size", error);
      }
    }
  }
  
  @objc
  func getPHAssetPath(_ internalId:NSString, resolve:  @escaping RCTPromiseResolveBlock, reject:  @escaping RCTPromiseRejectBlock) {
    var mediaIdentifier = internalId as String
    if mediaIdentifier.starts(with: "ph://")  {
      mediaIdentifier = mediaIdentifier.replacingOccurrences(of: "ph://", with: "")
    }
    
    guard let asset = PHAsset.fetchAssets(withLocalIdentifiers: [mediaIdentifier], options: nil).firstObject else {
      reject("NOT_FOUND", "Asset not found",  nil)
      return
    }

    let assetResources = PHAssetResource.assetResources(for: asset)
    if assetResources.first == nil {
        return
    }
    var filePath = ""
    let editOptions = PHContentEditingInputRequestOptions()
    // Download asset if on icloud.
    editOptions.isNetworkAccessAllowed = true

    asset.requestContentEditingInput(with: editOptions) { contentEditingInput, infos in
      var imageURL = contentEditingInput?.fullSizeImageURL
      if let audiovisualAsset = contentEditingInput?.audiovisualAsset as? AVURLAsset {
          imageURL = audiovisualAsset.url as URL
      }
      if let imageURL = imageURL, imageURL.absoluteString.count != 0 {
          filePath = imageURL.absoluteString.replacingOccurrences(of: "pathfile:", with: "file:")
          resolve(filePath)
      } else {
          let errorMessage = String.init(format: "Failed to load asset with localIdentifier %@ with no error message.", internalId)
          let error = RCTErrorWithMessage(errorMessage)
          reject("Error while getting file path", "Error while getting file path", error)
      }
    }
  }
  
  @objc
  func segmentImage(_ uri: NSURL, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard #available(iOS 15.0, *) else {
      reject("failure", "Unsupported OS version", nil)
      return;
    }
    DispatchQueue.global(qos: .default).async {
      let ciContext = CIContext(options: nil)
      let segmentationRequest = VNGeneratePersonSegmentationRequest()
      segmentationRequest.qualityLevel = .accurate
      
      #if targetEnvironment(simulator)
      segmentationRequest.usesCPUOnly = true
      #endif
      
      let requestHandler = VNImageRequestHandler(url: uri as URL, options: [VNImageOption.ciContext: ciContext])
      
      do {
        try requestHandler.perform([segmentationRequest])
        
        guard let result = segmentationRequest.results?.first as? VNPixelBufferObservation else {
          reject("failure", "No result from segmentation", nil)
          return
        }
        
        let maskImage = CIImage(cvPixelBuffer: result.pixelBuffer)
        let colorSpaceRGB = CGColorSpaceCreateDeviceRGB()
        
        guard let imageData = ciContext.pngRepresentation(of: maskImage, format: .BGRA8, colorSpace: colorSpaceRGB, options: [:]) else {
          reject("failure", "Error converting CIImage to NSData", nil)
          return
        }
        
        let fileUrl = FileUtils.getRanfomFileURL(withExtension: "png")
        do {
          try imageData.write(to: fileUrl)
        } catch {
          reject("Failure", "Could not write image data", error)
          return;
        }
        resolve(fileUrl.path)
      } catch let error {
        reject("failure", "Error during segmentation", error)
      }
    }
  }
  
  
  // Image Cache
  
  private var prefetchImageTasks = [NSURL:Nuke.AsyncImageTask]()
  
  private var imageCacheDispatchQueue = DispatchQueue(label: "com.azzapp.azzapp.MediaHelpers.imageCache")
  
  @objc
  private func prefetchImage(
    _ uri: NSURL,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    imageCacheDispatchQueue.sync {
       if uri.isFileURL {
        resolve(false)
        return
      }
      if prefetchImageTasks[uri] != nil {
        resolve(true)
        return
      }
      
      let request = ImageRequest(url: uri as URL)
      let pipeline = MediaPipeline.pipeline;
      
      if pipeline.cache.cachedImage(for: request) != nil {
        resolve(false)
        return
      }
      
      let task = pipeline.imageTask(with: request)
      prefetchImageTasks[uri] = task;
      
      Task {
        _ = try? await task.image
        _ = imageCacheDispatchQueue.sync {
          prefetchImageTasks.removeValue(forKey: uri)
        }
      }
      
      resolve(true)
    }
  }
  
  @objc
  func observeImagePrefetchResult(
     _ uri: NSURL,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    imageCacheDispatchQueue.sync {
      guard let task = prefetchImageTasks[uri] else {
        // that generally means that the prefetch was successfull before this method was called
        resolve(nil)
        return
      }
      Task {
        do {
          _ = try await task.image
        } catch {
          if (error is CancellationError) {
            resolve(nil)
          } else {
            reject("FAILED_TO_LOAD", "Task with uri: \(uri) failed", error)
          }
          return
        }
        resolve(nil)
      }
    }
  }
  
  @objc
  func cancelImagePrefetch(_ uri: NSURL) {
    imageCacheDispatchQueue.sync {
      guard let task = prefetchImageTasks[uri] else {
        return
      }
      task.cancel()
      prefetchImageTasks.removeValue(forKey: uri)
    }
  }
  
  @objc
  func addLocalCachedImage(_ mediaId: NSString, url: NSURL) {
    MediaURICache.imageCache.addLocaleFileCacheEntry(mediaId: mediaId, uri: url as URL)
  }
  
  
  // Video Cache
  
  @objc
  private func prefetchVideo(
    _ uri: NSURL,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      let prefetchCreated = try AVAssetCache.shared.prefetchAsset(for: uri as URL)
      resolve(prefetchCreated)
    } catch {
      reject("FAILURE", "Could not prefetch task", error)
    }
  }
  
  @objc
  func observeVideoPrefetchResult(
     _ uri: NSURL,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      try AVAssetCache.shared.observePrefetch(for: uri as URL, onComplete: {
        resolve(nil)
      }, onError: { error in
        reject("DOWNLOAD_ERROR", "Failed to prefetch asset", error)
      })
    } catch {
      reject("TASK_DOES_NOT_EXISTS", "Could not prefetch task", error)
    }
  }
  
  @objc
  func cancelVideoPrefetch(_ uri: NSURL) {
    do {
      try AVAssetCache.shared.cancelPrefetch(for: uri as URL)
    } catch {
      return
    }
  }
  
  @objc
  func addLocalCachedVideo(_ mediaId: NSString, url: NSURL) {
    MediaURICache.videoCache.addLocaleFileCacheEntry(mediaId: mediaId, uri: url as URL)
  }
  
}

