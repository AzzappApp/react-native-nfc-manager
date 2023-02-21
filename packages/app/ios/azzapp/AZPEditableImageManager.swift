//
//  AZPEditableImageManager.swift
//  azzapp
//
//  Created by François de Campredon on 20/01/2023.
//

import Foundation
import MetalKit
import Nuke
import CoreImage.CIFilterBuiltins
import CoreMedia.CMTime
import AVFoundation

@objc (AZPEditableImageManager)
class AZPEditableImageManager: RCTViewManager {
  override func view() -> UIView! {
    return AZPEditableImage(frame: CGRect())
  }
  
  @objc override static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  enum ExportError: Error {
    case imageLoadingFailure
    case dataGenerationFailure
  }
  
  @objc static func exportImage(
      uri: NSURL,
      parameters: NSDictionary?,
      filters: NSArray?,
      format: NSString?,
      quality: NSNumber?,
      size: CGSize,
      maskUri: NSURL?,
      backgroundColor: UIColor?,
      backgroundImageUri: NSURL?,
      backgroundImageTintColor: UIColor?,
      backgroundMultiply: Bool,
      foregroundUri: NSURL?,
      foregroundImageTintColor: UIColor?
  ) async throws -> Data {
    async let inputImageAsync =  AZPEditableImageCache.shared.loadImage(uri as URL)
    async let backgroundImageAsync = backgroundImageUri != nil
    ? AZPEditableImageCache.shared.loadImage(backgroundImageUri! as URL)
      : nil
    async let maskImageAsync = maskUri != nil
      ? AZPEditableImageCache.shared.loadImage(maskUri! as URL)
      : nil
    async let foregroundImageAsync = foregroundUri != nil
      ? AZPEditableImageCache.shared.loadImage(foregroundUri!  as URL)
      : nil
          
    let (
      inputImage,
      backgroundImage,
      maskImage,
      foregroundImage
    ) = try await (
      inputImageAsync,
      backgroundImageAsync,
      maskImageAsync,
      foregroundImageAsync
    )
    
    let transformationsParameters = NSMutableDictionary(dictionary: parameters ?? [:])
    transformationsParameters["outputSize"] = size;
    
    guard let inputImage = inputImage else {
      throw ExportError.imageLoadingFailure;
    }
    
    let image = await AZPEditableImage.transformImage(
      inputImage,
      parameters:  transformationsParameters,
      filters: filters,
      maskImage: maskImage,
      backgroundColor: backgroundColor,
      backgroundImage: backgroundImage,
      backgroundImageTintColor: backgroundImageTintColor,
      backgroundMultiply: backgroundMultiply,
      foregroundImage: foregroundImage,
      foregroundImageTintColor: foregroundImageTintColor
    )
    
    
    
    var imageData: Data?;
    let colorSpaceRGB = CGColorSpaceCreateDeviceRGB();
    if (format == "JPEG") {
      imageData = AZPEditableImage.ciContext.jpegRepresentation(
        of: image,
        colorSpace: colorSpaceRGB,
        options: [
          kCGImageDestinationLossyCompressionQuality as CIImageRepresentationOption: quality ?? 90
        ]
      )
    } else {
      imageData = AZPEditableImage.ciContext.pngRepresentation(
        of: image,
        format: CIFormat.RGBA8,
        colorSpace: colorSpaceRGB
      )
    }
    
    guard let imageData = imageData else {
      throw ExportError.dataGenerationFailure;
    }
    
    return imageData
  }
}

struct AZPEditableImageSource : Equatable {
  var uri: URL;
  var kind: String;
  var videoTime: CMTime?
  var backgroundUri: URL?
  var maskUri: URL?
  var foregroundUri: URL?
  
  static func == (lhs: AZPEditableImageSource, rhs: AZPEditableImageSource) -> Bool {
    return (
      lhs.uri == rhs.uri &&
      lhs.kind == rhs.kind &&
      lhs.videoTime == rhs.videoTime &&
      lhs.backgroundUri == rhs.backgroundUri &&
      lhs.maskUri == rhs.maskUri &&
      lhs.foregroundUri == rhs.foregroundUri
    )
  }
}

@objc(AZPEditableImage)
class AZPEditableImage: UIView, MTKViewDelegate {
  static let ciContext = CIContext()

  
  private var _source: AZPEditableImageSource?
  private var _currentLoadingTask: Task<Void, Error>?
  private var _imageView: MTKView!
  private var _commandQueue: MTLCommandQueue!
  private var _colorSpace: CGColorSpace!
  private var _inputImage: CIImage?
  private var _backgroundImage: CIImage?
  private var _maskImage: CIImage?
  private var _foregroundImage: CIImage?
  
  @objc
  var source: NSDictionary? {
    didSet {
      guard
        let source = source,
        let uriStr = source["uri"] as? String,
        let uri = URL(string: uriStr),
        let kind = source["kind"] as? String
      else {
        _source = nil
        sourceChanged()
        return;
      }
      let backgroundUriStr = source["backgroundUri"] as? String
      let maskUriStr = source["maskUri"] as? String
      let foregroundUriStr = source["foregroundUri"] as? String
      let videoTimeDouble = source["videoTime"] as? Double
      
      let backgroundUri = backgroundUriStr != nil ? URL(string: backgroundUriStr!) : nil
      let maskUri = maskUriStr != nil ? URL(string: maskUriStr!) : nil
      let foregroundUri = foregroundUriStr != nil ? URL(string: foregroundUriStr!) : nil
      let videoTime = videoTimeDouble != nil
        ? CMTimeMakeWithSeconds(videoTimeDouble!, preferredTimescale: 1)
        : nil
      
      let newSource  = AZPEditableImageSource(
        uri: uri,
        kind: kind,
        videoTime: videoTime,
        backgroundUri: backgroundUri,
        maskUri: maskUri,
        foregroundUri: foregroundUri
      )
      if (_source != newSource) {
        _source = newSource
        sourceChanged()
      }
    }
  }
  
  @objc
  var backgroundImageColor: UIColor? {
    didSet {
      _imageView.setNeedsDisplay()
    }
  }
  
  @objc
  var backgroundImageTintColor: UIColor? {
    didSet {
      _imageView.setNeedsDisplay()
    }
  }
  
  @objc
  var backgroundMultiply: Bool = false {
    didSet {
      _imageView.setNeedsDisplay()
    }
  }
  
  @objc
  var foregroundImageTintColor: UIColor? {
    didSet {
      _imageView.setNeedsDisplay()
    }
  }
   
  @objc
  var onLoadStart: RCTDirectEventBlock?

  @objc
  var onLoad: RCTDirectEventBlock?
  
  @objc
  var onError: RCTDirectEventBlock?
  
  @objc
  var editionParameters: NSDictionary? {
    didSet {
      _imageView.setNeedsDisplay()
    }
  }
  
  @objc
  var filters: NSArray? {
    didSet {
      _imageView.setNeedsDisplay()
    }
  }

  
  override init(frame: CGRect) {
    super.init(frame: frame)
    setupChildren()
  }
 
  required init?(coder: NSCoder) {
    super.init(coder: coder)
    setupChildren()
  }
  
  private func setupChildren() {
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
  
  func sourceChanged() {
    _currentLoadingTask?.cancel();
    _inputImage = nil
    _imageView.setNeedsDisplay();
    if (_source == nil) {
      return;
    }
    
    _currentLoadingTask = Task.detached {
      do {
        guard let source = await self._source else {
          return;
        }
        await self.onLoadStart?(nil)
        async let inputImageAsync = source.kind == "video"
          ? AZPEditableImageCache.shared.loadImageFromVideo(source.uri, time: source.videoTime ?? .zero)
          : AZPEditableImageCache.shared.loadImage(source.uri)
        async let backgroundImageAsync = source.backgroundUri != nil
          ? AZPEditableImageCache.shared.loadImage(source.backgroundUri!)
          : nil
        async let maskImageAsync = source.maskUri != nil
          ? AZPEditableImageCache.shared.loadImage(source.maskUri!)
          : nil
        async let foregroundImageAsync = source.foregroundUri != nil
          ? AZPEditableImageCache.shared.loadImage(source.foregroundUri!)
          : nil
          
        await (
          self._inputImage,
          self._backgroundImage,
          self._maskImage,
          self._foregroundImage
        ) = try await (
          inputImageAsync,
          backgroundImageAsync,
          maskImageAsync,
          foregroundImageAsync
        )
          
        await self.onLoad?(nil)
        await self._imageView.setNeedsDisplay()
      } catch {
        await self.onError?(["error": error.localizedDescription])
      }
    }
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
    
    if var image = _inputImage {
    
      #if targetEnvironment(simulator)
      image = AZPEditableImage.adaptImageForSimulator(image)
      #endif
      
      var maskImage = _maskImage;
      #if targetEnvironment(simulator)
      if maskImage != nil {
        maskImage = AZPEditableImage.adaptImageForSimulator(maskImage!)
      }
      #endif
      
      var backgroundImage = _backgroundImage
      #if targetEnvironment(simulator)
      if backgroundImage != nil {
        backgroundImage = AZPEditableImage.adaptImageForSimulator(backgroundImage!)
      }
      #endif
      
      var foregroundImage = _foregroundImage
      #if targetEnvironment(simulator)
      if foregroundImage != nil {
        foregroundImage = AZPEditableImage.adaptImageForSimulator(foregroundImage!)
      }
      #endif
      
      let transformationsParameters = NSMutableDictionary(dictionary: editionParameters ?? [:])
      transformationsParameters["outputSize"] = view.drawableSize;
      
      image = AZPEditableImage.transformImage(
        image,
        parameters: transformationsParameters,
        filters: filters,
        maskImage: maskImage,
        backgroundColor: backgroundImageColor,
        backgroundImage: backgroundImage,
        backgroundImageTintColor: backgroundImageTintColor,
        backgroundMultiply: backgroundMultiply,
        foregroundImage: foregroundImage,
        foregroundImageTintColor: foregroundImageTintColor
      )
      
      AZPEditableImage.ciContext
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
  
  static func transformImage(
    _ inputImage: CIImage,
    parameters: NSDictionary,
    filters: NSArray?,
    maskImage: CIImage?,
    backgroundColor: UIColor?,
    backgroundImage: CIImage?,
    backgroundImageTintColor: UIColor?,
    backgroundMultiply: Bool,
    foregroundImage: CIImage?,
    foregroundImageTintColor: UIColor?
  ) -> CIImage {
    var image = inputImage;

    var transformations: Array<String> = [azzappImageEditorTransformationKey as String];

    if let filters = filters as? [String] {
      transformations.append(contentsOf: filters)
    }
    
    for transformationName in transformations {
      guard let transformation = AZPTransformations.imageTransformation(forName: transformationName) else {
      continue;
      }
      image = transformation(image, parameters as? [AnyHashable : Any])!;
    }
    
    var backgroundColorImage: CIImage
    if let color = backgroundColor {
      backgroundColorImage = CIImage(color: CIColor(color: color))
    } else {
      backgroundColorImage = CIImage(color: CIColor.white)
    }
    backgroundColorImage = backgroundColorImage.cropped(to: image.extent)
    
    var background: CIImage;
    if let backgroundImage = backgroundImage {
      background = AZPEditableImage.scaleImageToDimension(
        backgroundImage,
        dimension: image.extent
      )
      if let color = backgroundImageTintColor {
        background = AZPEditableImage.tintImage(background, with: color)
      }
      background = background.composited(over: backgroundColorImage)
    } else {
      background = backgroundColorImage;
    }
    
    if (backgroundMultiply) {
      image = image.applyingFilter("CIMultiplyBlendMode", parameters: [
        "inputBackgroundImage": background
      ])
    }
    
    if var maskImage = maskImage {
      maskImage = AZPEditableImage.scaleImageToDimension(maskImage, dimension: inputImage.extent)
      let maskTransformationsParameters = NSMutableDictionary();
      maskTransformationsParameters["orientation"] = parameters["orientation"];
      maskTransformationsParameters["pitch"] = parameters["pitch"];
      maskTransformationsParameters["roll"] = parameters["roll"];
      maskTransformationsParameters["yaw"] = parameters["yaw"];
      maskTransformationsParameters["cropData"] = parameters["cropData"];
      maskTransformationsParameters["outputSize"] = parameters["outputSize"];
      
      let editorTransform = AZPTransformations.imageTransformation(forName: azzappImageEditorTransformationKey)!
      maskImage = editorTransform(maskImage, maskTransformationsParameters  as? [AnyHashable : Any])!
      
      let blendFilter = CIFilter.blendWithMask()
      blendFilter.inputImage = image
      blendFilter.backgroundImage = background
      blendFilter.maskImage = maskImage
      
      if let result = blendFilter.outputImage {
        image = result
      }
    }  else {
      image = image.composited(over: background)
    }
    
    if var foregroundImage = foregroundImage {
      foregroundImage = AZPEditableImage.scaleImageToDimension(foregroundImage, dimension: image.extent)
      if let color = foregroundImageTintColor {
        foregroundImage = AZPEditableImage.tintImage(foregroundImage, with: color)
      }
      image = foregroundImage.composited(over: image)
    }
    return image
  }
  
    
  private static func tintImage(_ image:CIImage, with color: UIColor) -> CIImage {
    let colorImage = CIImage(color: CIColor(color: color)).cropped(to: image.extent);
    return colorImage.applyingFilter("CIBlendWithAlphaMask", parameters: [
      "inputBackgroundImage": image,
      "inputMaskImage": image
    ])
  }
  
  private static func scaleImageToDimension(_ image:CIImage, dimension: CGRect) -> CIImage {
    var result = image.transformed(by: CGAffineTransform(
      scaleX: dimension.width / image.extent.width,
      y: dimension.height / image.extent.height
    ))
    result = result.transformed(by: CGAffineTransform(
      translationX: -result.extent.minX,
      y:  -result.extent.minY
    ))
    return result
  }
  
  private static func adaptImageForSimulator(_ image: CIImage) -> CIImage {
    return image
      .transformed(by: CGAffineTransform(scaleX: 1, y: -1))
      .transformed(by: CGAffineTransform(translationX: 0, y: image.extent.size.height))
  }
}
 
class AZPEditableImageCache {
  static var shared = AZPEditableImageCache()
  
  private class CacheEntry {
    var task: Task<CIImage?, Error>?
    var image: CIImage?
    
    init(task: Task<CIImage?, Error>) {
      self.task = task
    }
    
    func setResult(image: CIImage) {
      self.task = nil
      self.image = image;
    }
  }
  
  private let imageCache = NSMapTable<NSString, CacheEntry>.init(
    keyOptions: .copyIn,
    valueOptions: .weakMemory
  )
  
  private func loadImageIfNotCached(
    key: String,
    loader: @escaping () async throws -> CIImage?
  ) async throws -> CIImage? {
    NSLog("loadImageIfNotCached: init for key %@", key)
    let nsKey = key as NSString;
    if let entry = imageCache.object(forKey: nsKey) {
      if let image = entry.image {
        NSLog("loadImageIfNotCached: image cached for key %@", key)
        return image
      } else {
        NSLog("loadImageIfNotCached: task cached for key %@", key)
        return try await entry.task?.value
      }
    }
    
    NSLog("loading image for key %@", key)
    let task = Task {
      try await loader()
    }
    let entry = CacheEntry(task: task)
    imageCache.setObject(entry, forKey: nsKey)

    do {
      guard let image = try await task.value else {
        imageCache.removeObject(forKey: nsKey)
        return nil;
      }
      
      entry.setResult(image: image)
      return image
    } catch {
      imageCache.removeObject(forKey: nsKey)
      throw error
    }
  }
  
  public func loadImage(_ url: URL) async throws -> CIImage? {
    return try await loadImageIfNotCached(key: url.absoluteString) {
      let (data, _) = try await ImagePipeline.shared.data(for: url.asImageRequest())
      let image = CIImage(data: data, options: [.applyOrientationProperty: true])
      return image
    }
  }
  
  public func loadImageFromVideo(_ url: URL, time: CMTime) async throws -> CIImage? {
    let key = String(format: "%@-%lld", url.absoluteString, time.value)
    return try await loadImageIfNotCached(key: key) {
      let asset = AVAsset(url: url)
      let generator = AVAssetImageGenerator(asset: asset)
      guard let videoTrack = asset.tracks(withMediaType: .video).first else  {
        throw EditableImageError.noVideoTrack
      }
       
      let orientationTransform = self.getImageTransformForVideoTrack(videoTrack)
       
      let task = Task.detached {
        let cgiImage = try generator.copyCGImage(at: time, actualTime: nil)
        var image = CIImage(cgImage: cgiImage);
        image = image.transformed(by: orientationTransform)
        image = image.transformed(by: CGAffineTransform(
          translationX: -image.extent.origin.x,
          y: -image.extent.origin.y
        ))
        return image
      }
      
      return try await task.value
    }
  }
  
  func orientationFor(_ track: AVAssetTrack) -> UIImage.Orientation {
    let t = track.preferredTransform;
    if (t.a == 0 && t.b == 1.0 && t.d == 0) {
      return .up;
    } else if (t.a == 0 && t.b == -1.0 && t.d == 0) {
      return .down;
    } else if (t.a == 1.0 && t.b == 0 && t.c == 0) {
      return .right;
    } else if (t.a == -1.0 && t.b == 0 && t.c == 0) {
      return .left;
    }
    return .up;
  }
  
   func getImageTransformForVideoTrack(_ track:AVAssetTrack) -> CGAffineTransform {
    let orientation = orientationFor(track)
    switch(orientation) {
     case .up:
       return CGAffineTransformMakeRotation(-.pi/2);
     case .upMirrored:
       return CGAffineTransformScale(CGAffineTransformMakeRotation(-.pi/2), -1, 1);
     case .down:
       return CGAffineTransformMakeRotation(.pi/2);
     case .downMirrored:
       return CGAffineTransformScale(CGAffineTransformMakeRotation(.pi/2), -1, 1);
     case .left:
       return CGAffineTransformMakeRotation(.pi);
     case .leftMirrored:
       return CGAffineTransformScale(CGAffineTransformMakeRotation(.pi), 1, -1);
     case .right:
       return CGAffineTransformIdentity;
     case .rightMirrored:
       return CGAffineTransformMakeScale(1, -1);
     default:
       return CGAffineTransformMakeRotation(-.pi/2);
    }
  }
  
}

enum EditableImageError: Error {
    case noVideoTrack
}
