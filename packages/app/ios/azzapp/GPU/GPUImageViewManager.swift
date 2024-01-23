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
  
  internal var layersImages: [GPULayerSource:SourceImage]? {
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
     
    var layerSourceToLoad: [(GPULayerSource, Bool)] = []
    var loadedLayersImages = [GPULayerSource:SourceImage]()
    for gpuLayer in gpuLayers {
      if let image = layersImages?[gpuLayer.source] {
        loadedLayersImages[gpuLayer.source] = image
      } else {
        layerSourceToLoad.append((gpuLayer.source, true))
      }
      if let maskUri = gpuLayer.maskUri {
        let source = GPULayerSource.image(uri: maskUri)
        if let image = layersImages?[source] {
          loadedLayersImages[source] = image
        } else {
          layerSourceToLoad.append((source, true))
        }
      }
      if let lutFilterUri = gpuLayer.lutFilterUri {
        let source = GPULayerSource.image(uri: lutFilterUri)
        if let image = layersImages?[source] {
          loadedLayersImages[source] = image
        } else {
          layerSourceToLoad.append((source, false))
        }
      }
    }
    if !layerSourceToLoad.isEmpty {
      imagesLoadingTask = Task {
        do {
          onLoadStart?(nil)
          try await withThrowingTaskGroup(of: (GPULayerSource, SourceImage).self) {
            group in
              for (layerSource, inverseYOnSimulator) in layerSourceToLoad {
                group.addTask {
                  guard var image = try await GPULayerImageLoader.shared.loadLayerImage(layerSource) else {
                    throw GPUViewError.failedToLoad(layerSource)
                  }
                  #if targetEnvironment(simulator)
                  if #unavailable(iOS 17) {
                    if (inverseYOnSimulator) {
                      image = image.inverseY() ?? image
                    }
                  }
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
