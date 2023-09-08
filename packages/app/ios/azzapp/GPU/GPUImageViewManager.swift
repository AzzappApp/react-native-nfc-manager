//
//  GPUImageViewManager.swift
//  azzapp
//
//  Created by François de Campredon on 06/04/2023.
//


import Foundation
import MetalKit
import CoreMedia.CMTime

@objc(AZPGPUImageViewManager)
class GPUImageViewManager: RCTViewManager {
  override func view() -> UIView! {
    return GPUImageView()
  }
  
  override var methodQueue: DispatchQueue! {
    return DispatchQueue.main
  }
  
  @objc override static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  @objc
  final func exportViewImage(
    _ tag: NSNumber,
    format: String,
    quality: NSNumber,
    size: CGSize,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let view = bridge.uiManager.view(forReactTag: tag) as! GPUImageView
    if view.imagesLoadingTask != nil {
      reject(GPUViewError.FAILED_TO_EXPORT_CODE, "GPUImageView is not ready for export", nil)
      return
    }
    guard let gpuLayers = view.gpuLayers, let layersImages = view.layersImages else {
      reject(GPUViewError.FAILED_TO_EXPORT_CODE, "Cannot export image from an empty GPUImageView", nil)
      return
    }
    
    Task.detached {
      await self.exportGPULayers(
        gpuLayers,
        layersImages: layersImages,
        backgroundColor: view.backgroundColor,
        format: format,
        quality: quality.doubleValue / 100,
        size: size,
        resolve: resolve,
        reject: reject
      )
    }
  
  }
  
  @objc
  final func exportLayers(
    _ layers: NSArray,
    backgroundColor: UIColor?,
    format: String,
    quality: NSNumber,
    size: CGSize,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock) {
   
    let gpuLayers = GPULayer.fromNSarray(layers)
    Task.detached {
      var layersImages =  [GPULayerSource:CIImage]()
      do {
        try await withThrowingTaskGroup(of: (GPULayerSource, CIImage).self) {
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
        format: format,
        quality: quality.doubleValue / 100,
        size: size,
        resolve: resolve,
        reject: reject
      )
    }
  }
  
  private final func exportGPULayers(
    _ gpuLayers: [GPULayer],
    layersImages: [GPULayerSource:CIImage],
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
}


@objc(AZPGPUImageView)
class GPUImageView: UIView, MTKViewDelegate {

  static internal let ciContext = CIContext()
  
  @objc
  var onLoadStart: RCTDirectEventBlock?

  @objc
  var onLoad: RCTDirectEventBlock?
  
  @objc
  var onError: RCTDirectEventBlock?
  
  @objc
  var layers: NSArray? {
    didSet {
      guard let layers = layers else {
        self.gpuLayers = nil
        return
      }
      self.gpuLayers = GPULayer.fromNSarray(layers)
    }
  }
  
  override var backgroundColor: UIColor? {
    didSet {
      if (backgroundColor != oldValue) {
        _imageView.setNeedsDisplay()
      }
    }
  }
  
  internal var layersImages: [GPULayerSource:CIImage]? {
    didSet {
      _imageView.setNeedsDisplay()
    }
  }
  
  internal var imagesLoadingTask: Task<Void, Never>?
  
  internal var gpuLayers: [GPULayer]? {
    didSet {
      syncLayersImages()
    }
  }
  
  
  private var _imageView: MTKView!
  private var _commandQueue: MTLCommandQueue!
  private var _colorSpace: CGColorSpace!
  
  
  override init(frame: CGRect) {
    super.init(frame: frame)
    _imageView = MTKView(frame: self.frame);
    _imageView.isPaused = true;
    _imageView.enableSetNeedsDisplay = true;
    _imageView.isOpaque = false;
    _imageView.framebufferOnly = false;
    _imageView.clearColor = MTLClearColorMake(0, 0, 0, 0);
    _imageView.device = MTLCreateSystemDefaultDevice();
    _imageView.delegate = self
    _imageView.autoResizeDrawable = true;
    _imageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    addSubview(_imageView)
    
    _commandQueue = _imageView.device?.makeCommandQueue()
    _colorSpace = CGColorSpaceCreateDeviceRGB();
  }
 
  @available(*, unavailable)
  required init?(coder _: NSCoder) {
    fatalError("init(coder:) is not implemented.")
  }
  
  func mtkView(_ view: MTKView, drawableSizeWillChange size: CGSize) {
    view.setNeedsDisplay()
  }
  
  func draw(in view: MTKView) {
    guard
      let renderPassDescriptor = view.currentRenderPassDescriptor,
      let currentDrawable = view.currentDrawable,
      let commandBuffer = _commandQueue.makeCommandBuffer(),
      let commandEncoder = commandBuffer.makeRenderCommandEncoder(descriptor: renderPassDescriptor)
    else {
      return;
    }
    commandEncoder.endEncoding()
    
    var image: CIImage? = nil
    if let backgroundColor = backgroundColor {
      image = CIImage(color: CIColor(color: backgroundColor))
        .cropped(to: CGRectMake(0, 0, view.drawableSize.width, view.drawableSize.height))
    }
    
    if let layers = gpuLayers {
      for layer in layers {
        if let layerImage = GPULayer.draw(layer, withSize: view.drawableSize, onTopOf: image, withImages: layersImages) {
          image = layerImage
        }
      }
    }
    
    if let image = image {
      GPUImageView.ciContext
        .render(image,
          to: currentDrawable.texture,
          commandBuffer: commandBuffer,
          bounds: CGRect(
            x: 0, y: 0,
            width: view.drawableSize.width,
            height: view.drawableSize.height
          ),
          colorSpace: _colorSpace
        )
    }
    commandBuffer.present(currentDrawable)
    commandBuffer.commit()
  }
  
  
  private func syncLayersImages() {
    _imageView.setNeedsDisplay()
    imagesLoadingTask?.cancel()
    imagesLoadingTask = nil
    guard let gpuLayers = gpuLayers else {
      layersImages = nil
      return
    }
     
    var layerSourceToLoad: [GPULayerSource] = []
    var loadedLayersImages = [GPULayerSource:CIImage]()
    for gpuLayer in gpuLayers {
      if let image = layersImages?[gpuLayer.source] {
        loadedLayersImages[gpuLayer.source] = image
      } else {
        layerSourceToLoad.append(gpuLayer.source)
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
    if !layerSourceToLoad.isEmpty {
      imagesLoadingTask = Task {
        do {
          onLoadStart?(nil)
          try await withThrowingTaskGroup(of: (GPULayerSource, CIImage).self) {
            group in
              for layerSource in layerSourceToLoad {
                group.addTask {
                  guard var image = try await GPULayerImageLoader.shared.loadLayerImage(layerSource) else {
                    throw GPUViewError.failedToLoad(layerSource)
                  }
                  #if targetEnvironment(simulator)
                  image = image.inverseY()
                  #endif
                  return (layerSource, image)
                }
              }
              for try await (layerSource, image) in group {
                loadedLayersImages[layerSource] = image
              }
          }
          layersImages = loadedLayersImages
          onLoad?(nil)
        } catch {
          if !(error is CancellationError) {
            if let error = error as? GPUViewError {
              onError?([
                "code": error.code,
                "message": error.message
              ])
            } else {
              onError?([
                "code": "UNKNOWN_ERROR",
                "message": error.localizedDescription
              ])
            }
            imagesLoadingTask = nil
            // TODO manage errornous state
          }
        }
        if (Task.isCancelled) {
          return
        }
        imagesLoadingTask = nil
      }
    } else {
      layersImages = loadedLayersImages
    }
  }
}
