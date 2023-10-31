//
//  GPUHelpers.swift
//  azzapp
//
//  Created by François de Campredon on 22/09/2023.
//

import Foundation




@objc(AZPGPUHelpers)
class GPUHelpers: NSObject {
  
  @objc static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  @objc
  final func exportLayersToImage(
    _ layers: NSArray,
    backgroundColor: UIColor?,
    format: String,
    quality: NSNumber,
    size: CGSize,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock) {
   
    let gpuLayers = GPULayer.fromNSarray(layers)
    Task.detached {
      var layersImages =  [GPULayerSource:SourceImage]()
      do {
        try await withThrowingTaskGroup(of: (GPULayerSource, SourceImage).self) {
          group in
            for gpuLayer in gpuLayers {
              let layerSource = gpuLayer.source
              group.addTask {
                guard let image = try await GPULayerImageLoader.shared.loadLayerImage(layerSource) else {
                  throw GPUViewError.failedToLoad(layerSource)
                }
                return (layerSource, image)
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
              if let lutFilterUri = gpuLayer.lutFilterUri {
                let layerSource = GPULayerSource.image(uri: lutFilterUri)
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
      self.exportGPULayersToImage(
        gpuLayers,
        layersImages: layersImages,
        backgroundColor: backgroundColor,
        format: format,
        quality: quality.doubleValue / 100,
        size: size,
        resolve: resolve,
        reject: reject
      )
    }
  }
  
  private final func exportGPULayersToImage(
    _ gpuLayers: [GPULayer],
    layersImages: [GPULayerSource:SourceImage],
    backgroundColor: UIColor?,
    format: String,
    quality: Double,
    size: CGSize,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock) {
    
    
    var image: CIImage? = nil
    if let backgroundColor = backgroundColor {
      image = CIImage(color: CIColor(color: backgroundColor))
        .cropped(to: CGRectMake(0, 0, size.width, size.height))
    }
    
    for layer in gpuLayers {
      if let layerImage = GPULayer.draw(
        layer,
        withSize: size,
        onTopOf: image,
        withImages: layersImages
      ) {
        image = layerImage
      }
    }
    
    guard let image = image else {
      reject(GPUViewError.FAILED_TO_EXPORT_CODE, "Cannot export Empty image", nil)
      return;
    }
    
    var imageData: Data?;
    let colorSpaceRGB = CGColorSpaceCreateDeviceRGB();
    
    var imageFormat = format
    if (imageFormat == "auto") {
      imageFormat = getPreferredFormat(image)
    }
    
    if (imageFormat == "png") {
      imageData = GPUImageView.ciContext.pngRepresentation(
        of: image,
        format: CIFormat.RGBA8,
        colorSpace: colorSpaceRGB
      )
    } else {
      imageData = GPUImageView.ciContext.jpegRepresentation(
        of: image,
        colorSpace: colorSpaceRGB,
        options: [
          kCGImageDestinationLossyCompressionQuality as CIImageRepresentationOption: quality
        ]
      )
    }
    
    guard let imageData = imageData else {
      reject(GPUViewError.FAILED_TO_EXPORT_CODE, "Could not generate image data", nil)
      return;
    }
    
    let fileUrl = FileUtils.getRanfomFileURL(withExtension: format == "png" ? "png" : "jpg")
    do {
      try imageData.write(to: fileUrl)
    } catch {
      reject(GPUViewError.FAILED_TO_EXPORT_CODE, "Could not write image data", error)
      return;
    }
    resolve(fileUrl.path)
  }
  
  
  private func getPreferredFormat(_ image: CIImage) -> String {
  
    guard #available(iOS 14.0, *) else {
      return "jpg"
    }
    

    let filter = CIFilter.areaAverage()
    filter.inputImage = image
    filter.extent = image.extent
    guard let output = filter.outputImage else {
      return "jpg"
    }
    
    var bitmap = [UInt8](repeating: 0, count: 4)
    GPUImageView.ciContext.render(
      output,
      toBitmap: &bitmap,
      rowBytes: 4,
      bounds: CGRect(x: 0, y: 0, width: 1, height: 1),
      format: .RGBA8,
      colorSpace: nil
    )
    
    if (CGFloat(bitmap[3]) < 255) {
      return "png"
    } else {
      return "jpg"
    }
  }
  
  
  
  @objc
  final func exportLayersToVideo(
    _ layers: NSArray,
    backgroundColor: UIColor?,
    size: CGSize,
    bitRate: NSNumber,
    removeSound: Bool,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock) {
   
    let gpuLayers = GPULayer.fromNSarray(layers)
    Task.detached {
      var layersImages =  [GPULayerSource:SourceImage]()
      do {
        try await withThrowingTaskGroup(of: (GPULayerSource, SourceImage).self) {
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
              if let lutFilterUri = gpuLayer.lutFilterUri {
                let layerSource = GPULayerSource.image(uri: lutFilterUri)
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
      await self.exportGPULayersToVideo(
        gpuLayers,
        layersImages: layersImages,
        backgroundColor: backgroundColor,
        size: size,
        bitRate: bitRate,
        removeSound: removeSound,
        resolve: resolve,
        reject: reject
      )
    }
  }
  
  private final func exportGPULayersToVideo(
    _ gpuLayers: [GPULayer],
    layersImages: [GPULayerSource:SourceImage],
    backgroundColor: UIColor?,
    size: CGSize,
    bitRate: NSNumber,
    removeSound: Bool,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock) async {
    
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
    
    let outputUrl = FileUtils.getRanfomFileURL(withExtension: "mp4")
    
    var outputSize = size;
    if let cropRect = videoLayer.parameters?.cropData {
      if cropRect.width != 0 && cropRect.height != 0 && cropRect.width < size.width {
        outputSize = cropRect.size
      }
    }
    
    var asset: AVAsset;
   
    do {
      let location = try await downloadFile(url: uri)
      asset = AVAsset(url: location)
    } catch {
      reject(GPUViewError.FAILED_TO_EXPORT_CODE, "Could not download file", error)
      return
    }
    
    guard let videoTrack = asset.tracks(withMediaType: .video).first else {
      reject(GPUViewError.FAILED_TO_EXPORT_CODE, "No video track found in video layer", nil)
      return
    }
    
    // TODO wait for duration loading
    let timeRange = CMTimeRange(
      start: startTime ?? CMTime.zero,
      duration: duration ?? (asset.duration - (startTime ?? CMTime.zero))
    )
    
    var formatHint: CMFormatDescription? = nil
    if let format = videoTrack.formatDescriptions.last  {
      formatHint = (format as! CMFormatDescription)
    }
    let videoWriterInput = AVAssetWriterInput(
      mediaType: AVMediaType.video,
      outputSettings: [
        AVVideoCodecKey: AVVideoCodecType.h264,
        AVVideoWidthKey: outputSize.width,
        AVVideoHeightKey: outputSize.height,
        AVVideoCompressionPropertiesKey: [
          AVVideoProfileLevelKey:AVVideoProfileLevelH264HighAutoLevel,
          AVVideoH264EntropyModeKey:AVVideoH264EntropyModeCABAC,
          AVVideoAllowFrameReorderingKey:videoTrack.requiresFrameReordering,
          AVVideoAverageBitRateKey: bitRate
        ] as [String : Any],
      ],
      sourceFormatHint: formatHint
    )
    videoWriterInput.transform = CGAffineTransformIdentity
    videoWriterInput.expectsMediaDataInRealTime = false
    videoWriterInput.performsMultiPassEncodingIfSupported = true
    
    var writer: AVAssetWriter
    do {
      writer = try AVAssetWriter(url: outputUrl, fileType: AVFileType.mp4)
      // TODO do we need to test canAddInput ??
      writer.add(videoWriterInput)
    } catch {
      reject(GPUViewError.FAILED_TO_EXPORT_CODE, "Could not instanciate AVAssetWriter \(error)", error)
      return
    }
    
    let composition = AVMutableVideoComposition(asset: asset, applyingCIFiltersWithHandler: {
      request in
        let videoImage = request.sourceImage
        var layersImages = layersImages
        layersImages[videoLayer.source] = SourceImage(ciImage: videoImage)
        
        let size = request.renderSize
        var image: CIImage? = nil
        if let backgroundColor = backgroundColor {
          image = CIImage(color: CIColor(color: backgroundColor))
            .cropped(to: CGRectMake(0, 0, outputSize.width, outputSize.height))
        }
        
        for layer in gpuLayers {
          if let layerImage = GPULayer.draw(
            layer,
            withSize: size,
            onTopOf: image,
            withImages: layersImages
          ) {
            image = layerImage
          }
        }
        
        guard let image = image else {
          request.finish(with: videoImage, context: nil)
          return
        }
      
        request.finish(with: image, context: nil)
    })
    composition.renderSize = outputSize
    let timescale = Int32(ceil(min(30, videoTrack.nominalFrameRate)))
    composition.frameDuration = CMTimeMake(value: 1, timescale: timescale)
    
    let videoOutput = AVAssetReaderVideoCompositionOutput(videoTracks: [videoTrack], videoSettings: nil)
    videoOutput.videoComposition = composition
    
    var videoReader: AVAssetReader
    do {
      videoReader = try AVAssetReader(asset: asset)
      // TODO should we use canAddOutput ?
      videoReader.add(videoOutput)
    } catch {
      reject(GPUViewError.FAILED_TO_EXPORT_CODE, "Could not instanciate AVAssetReader \(error) \(asset)", error)
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
      if let format = audioTrack.formatDescriptions.last  {
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
        reject(GPUViewError.FAILED_TO_EXPORT_CODE, "Could not instanciate AVAssetReader on audio \(error) \(asset)", error)
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
      
    let finishWriting = {
      writer.finishWriting {
        resolve(outputUrl.path)
      }
    }
    
    let writeToAudioTrack = {
      var audioFinished = false;
      if let audioWriterInput = audioWriterInput, let audioReader = audioReader, let audioOutput = audioOutput {
        audioWriterInput.requestMediaDataWhenReady(on: dispatchQueue) {
          while(audioWriterInput.isReadyForMoreMediaData) {
            if audioReader.status == .completed {
              if (!audioFinished) {
                audioFinished = true;
                audioWriterInput.markAsFinished()
                finishWriting()
              }
              return;
            } else if audioReader.status == .failed {
              if (!audioFinished) {
                audioFinished = true;
                reject(
                  GPUViewError.FAILED_TO_EXPORT_CODE,
                  "audioReader.status : failed",
                  videoReader.error
                );
              }
              return;
            }
              
            if let sampleBuffer = audioOutput.copyNextSampleBuffer() {
              while (!audioWriterInput.isReadyForMoreMediaData) {
                usleep(5000)
              }
              audioWriterInput.append(sampleBuffer)
            }
          }
        }
      } else {
        finishWriting()
      }
    }
    
    var videoFinished = false;
    videoWriterInput.requestMediaDataWhenReady(on: dispatchQueue) {
      while(videoWriterInput.isReadyForMoreMediaData) {
        if videoReader.status == .completed {
          if (!videoFinished) {
            videoFinished = true;
            videoWriterInput.markAsFinished()
            writeToAudioTrack()
          }
          return;
        } else if videoReader.status == .failed {
          if (!videoFinished) {
            videoFinished = true;
            reject(
              GPUViewError.FAILED_TO_EXPORT_CODE,
              "videoReader.status : failed",
              videoReader.error
            );
          }
          return;
        }
        if let sampleBuffer = videoOutput.copyNextSampleBuffer() {
          while (!videoWriterInput.isReadyForMoreMediaData) {
            usleep(5000)
          }
          videoWriterInput.append(sampleBuffer)
        }
      }
    }
  }
  
  private func downloadFile (url: URL) async throws -> URL {
    return try await withCheckedThrowingContinuation({
      (continuation: CheckedContinuation<URL, Error>) in
      let task = URLSession.shared.downloadTask(with: url) {
        downloadedURL, response, error in
        guard let downloadedURL = downloadedURL else {
          continuation.resume(throwing:
            error ?? GPUViewError.failedToLoad(.video(uri: url, startTime: nil, duration: nil)))
          return;
        }
        let tempFile = FileUtils.getRanfomFileURL(withExtension: url.pathExtension)
        try? FileManager.default.copyItem(at: downloadedURL, to: tempFile)
        continuation.resume(returning: tempFile)
      }
      task.resume()
    })
  }
}
