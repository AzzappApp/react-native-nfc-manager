//
//  GPULayer.swift
//  azzapp
//
//  Created by François de Campredon on 05/04/2023.
//

import Foundation
import CoreMedia.CMTime
import CoreImage
import CoreImage.CIFilterBuiltins



protocol GPULayerTransform {
  func transform(_ image: CIImage, withScale scale: CGFloat) -> CIImage
}

enum Blending {
  case none
  case multiply
}


struct GPULayerEditionParameters: Equatable {
  var brightness: Float?
  var contrast: Float?
  var highlights: Float?
  var saturation: Float?
  var shadow: Float?
  var sharpness: Float?
  var structure: Float?
  var temperature: Float?
  var tint: Float?
  var vibrance: Float?
  var vignetting: Float?
  var pitch: Float?
  var roll: Float?
  var yaw: Float?
  var cropData: CGRect?;
  var orientation: CGImagePropertyOrientation?;
  
  static func fromDict(_ dict: [String: Any]?) -> GPULayerEditionParameters? {
    guard let dict = dict else {
      return nil
    }
    var cropData: CGRect? = nil
    if
      let cropDataDict = dict["cropData"] as? [String: CGFloat],
      let originX = cropDataDict["originX"],
      let originY = cropDataDict["originY"],
      let width = cropDataDict["width"],
      let height = cropDataDict["height"] {
      cropData = CGRectMake(originX, originY, width, height)
    }
    var orientation: CGImagePropertyOrientation?
    if let orientationStr = dict["orientation"] as? String {
      switch orientationStr {
        case "UP":
          orientation = .up
          break;
        case "RIGHT":
          orientation = .right
        case "DOWN":
          orientation = .down
          break;
        case "LEFT":
          orientation = .left
          break;
        default:
          orientation = nil
          break;
      }
    }
    
    
    return GPULayerEditionParameters(
      brightness: toFloat(dict["brightness"]),
      contrast:  toFloat(dict["contrast"]),
      highlights:  toFloat(dict["highlights"]),
      saturation:  toFloat(dict["saturation"]),
      shadow:  toFloat(dict["shadow"]),
      sharpness:  toFloat(dict["sharpness"]),
      structure:  toFloat(dict["structure"]),
      temperature:  toFloat(dict["temperature"]),
      tint:  toFloat(dict["tint"]),
      vibrance:  toFloat(dict["vibrance"]),
      vignetting:  toFloat(dict["vignetting"]),
      pitch:  toFloat(dict["pitch"]),
      roll:  toFloat(dict["roll"]),
      yaw:  toFloat(dict["yaw"]),
      cropData: cropData,
      orientation: orientation
    )
  }
  
  private static func toFloat(_ value: Any?) -> Float? {
    if let value = value as? String {
      return Float(value)
    }
    if let value = value as? Double  {
      return Float(value)
    }
    if let value = value as? Float  {
      return value
    }
    return nil
  }
}


enum GPULayerSource: Equatable, Hashable {
  case image(uri: URL)
  case videoFrame(uri: URL, time: CMTime)
  case video(uri: URL, startTime: CMTime?, duration: CMTime?)
  
  var stringRepresentation: String {
    switch self {
    
    case .image(uri: let uri):
      return "Image(uri: '\(uri)')"
    case .videoFrame(uri: let uri, time: let time):
      return "VideoFrame(uri: '\(uri)', time: \(time))"
    case .video(uri: let uri, startTime: let startTime, duration: let duration):
      return "Video(uri: '\(uri)', startTime: \(String(describing: startTime)), duration: \(String(describing: duration)))"
    }
  }
}

struct GPULayer: Equatable {
  let source: GPULayerSource
  let parameters: GPULayerEditionParameters?
  let filters: [String]?
  let maskUri: URL?
  let backgroundColor: UIColor?
  let tintColor: UIColor?
  let blending: Blending?
  
  static func fromNSarray(_ layers: NSArray) -> [GPULayer] {
    var gpuLayers = [GPULayer]()
    for dict in layers {
      guard
        let dict = dict as? [String: Any],
        let layerDescriptor = GPULayer.fromDict(dict)
      else {
        ReactLogger.log(level: RCTLogLevel.warning, message: "Invalid layer \(String(describing: dict))")
        continue
      }
      gpuLayers.append(layerDescriptor)
    }
    return gpuLayers
  }
  
  static func fromDict(_ dict: [String: Any]) -> GPULayer? {
    let parameters = GPULayerEditionParameters.fromDict(dict["parameters"] as? [String: Any])
    var filters: [String]?
    if let filtersArrays = dict["filters"] as? [String] {
      filters = filtersArrays
    } else if let filtersDict = dict["filters"] as? [String:String] {
      // reanimated sometimes transform arrays to object
      filters = [String]()
      for filter in filtersDict.values {
        filters?.append(filter)
      }
    }
    let maskUriStr = dict["maskUri"] as? String
    let maskUri = maskUriStr != nil ? URL(string: maskUriStr!) : nil
    let backgroundColorStr = dict["backgroundColor"] as? String
    let backgroundColor = backgroundColorStr != nil ? UIColor(stringRepresentation: backgroundColorStr!) : nil
    let tintColorStr = dict["tintColor"] as? String
    let tintColor = tintColorStr != nil ? UIColor(stringRepresentation: tintColorStr!) : nil
    let uriStr = dict["uri"] as? String
    let uri = uriStr != nil ? URL(string: uriStr!) : nil
    let blendingStr = dict["blending"] as? String
    
    guard let uri = uri else {
      return nil
    }
    
    var source: GPULayerSource
    let kind = dict["kind"] as? String
    switch(kind) {
      case "image":
        source = .image(uri: uri)
        break;
      case "videoFrame":
        let timeDouble = dict["time"] as? Double ?? 0
        let time = CMTimeMakeWithSeconds(timeDouble, preferredTimescale: 600)
        source = .videoFrame(uri: uri, time: time)
        break;
      case "video":
        var startTime: CMTime?
        var duration: CMTime?
        if let startTimeDouble = dict["startTime"] as? Double {
          startTime = CMTimeMakeWithSeconds(startTimeDouble, preferredTimescale: 600)
        }
        if let durationDouble = dict["duration"] as? Double {
          duration = CMTimeMakeWithSeconds(durationDouble, preferredTimescale: 600)
        }
        source = .video(uri: uri, startTime: startTime, duration: duration)
      default:
        return nil
    }
    
    return GPULayer(
      source: source,
      parameters: parameters,
      filters: filters,
      maskUri: maskUri,
      backgroundColor: backgroundColor,
      tintColor: tintColor,
      blending: blendingStr == "multiply" ? Blending.multiply : Blending.none
    )
  }
  
  static func draw(_
    layer: GPULayer,
    withSize size: CGSize,
    onTopOf underlayImage: CIImage?,
    withImages layerImages: [GPULayerSource: CIImage]?,
    inverseOnSimulator: Bool = true
  ) -> CIImage? {
    guard var image = layerImages?[layer.source] else {
      return underlayImage
    }
    
    #if targetEnvironment(simulator)
    if inverseOnSimulator  {
      image = adaptImageForSimulator(image)
    }
    #endif
    
    let parameters = layer.parameters ?? GPULayerEditionParameters()
    if let orientation = parameters.orientation {
      image = image.oriented(orientation)
    }
    if parameters.pitch != nil || parameters.roll != nil || parameters.yaw != nil {
      let ciPerspectiveRotateFilter = CIFilter.perspectiveRotate()
      
      ciPerspectiveRotateFilter.inputImage = image
      if let pitch = parameters.pitch {
        ciPerspectiveRotateFilter.pitch = degToRad(pitch)
      }
      if let roll = parameters.roll {
        ciPerspectiveRotateFilter.roll = degToRad(roll)
      }
      if let yaw = parameters.yaw {
        ciPerspectiveRotateFilter.yaw = degToRad(yaw)
      }
      image = ciPerspectiveRotateFilter.outputImage!
      image = image.transformed(by: CGAffineTransform(translationX: -image.extent.origin.x, y: -image.extent.origin.y))
    }
    
    if let cropData = parameters.cropData {
      image = image.cropped(to: cropData)
      image = image.transformed(by: CGAffineTransform(translationX: -cropData.origin.x, y: -cropData.origin.y))
    }
    
    let scale = size.width / image.extent.width
    image = image.transformed(by: CGAffineTransform(scaleX: scale, y: scale))
    
    if parameters.brightness != nil || parameters.saturation != nil || parameters.contrast != nil {
        let ciColorControlsFilter = CIFilter.colorControls()
        ciColorControlsFilter.inputImage = image
        if let brightness = parameters.brightness {
            ciColorControlsFilter.brightness = brightness
        }
        if let saturation = parameters.saturation {
            ciColorControlsFilter.saturation = saturation
        }
        if let contrast = parameters.contrast {
            ciColorControlsFilter.contrast = contrast
        }
        image = ciColorControlsFilter.outputImage!
    }
    
    if parameters.shadow != nil || parameters.highlights != nil {
      let cIHighlightShadowAdjust = CIFilter.highlightShadowAdjust()
      cIHighlightShadowAdjust.inputImage = image
      if let shadow = parameters.shadow {
        cIHighlightShadowAdjust.shadowAmount = shadow
      }
      if let highlights = parameters.highlights {
        cIHighlightShadowAdjust.highlightAmount = highlights
      }
      image = cIHighlightShadowAdjust.outputImage!
    }
    
    if parameters.temperature != nil || parameters.tint != nil {
      let ciTemperatureFilter = CIFilter.temperatureAndTint()
      ciTemperatureFilter.inputImage = image
      ciTemperatureFilter.neutral = CIVector(x: CGFloat(parameters.temperature ?? 6500), y: 0)
      ciTemperatureFilter.targetNeutral = CIVector(x: 6500, y: CGFloat(parameters.tint ?? 0))
      image = ciTemperatureFilter.outputImage!
    }
    
    if let sharpness = parameters.sharpness {
      let ciSharpnessFilter = CIFilter.sharpenLuminance()
      ciSharpnessFilter.inputImage = image
      ciSharpnessFilter.sharpness = sharpness
      image = ciSharpnessFilter.outputImage!
    }
    
    if let structure =  parameters.structure {
      let ciUnsharpMaskFilter = CIFilter.unsharpMask()
      ciUnsharpMaskFilter.inputImage = image
      ciUnsharpMaskFilter.intensity = structure
      image = ciUnsharpMaskFilter.outputImage!
    }
    
    if let vibrance =  parameters.vibrance {
      let ciVibranceFilter = CIFilter.vibrance()
      ciVibranceFilter.inputImage = image
      ciVibranceFilter.amount = vibrance
      image = ciVibranceFilter.outputImage!
    }
    
    if let vignetting = parameters.vignetting {
      let ciVignetteFilter = CIFilter.vignette()
      ciVignetteFilter.inputImage = image
      ciVignetteFilter.intensity = vignetting
      image = ciVignetteFilter.outputImage!
    }
    
    if let filters = layer.filters {
      for filter in filters {
        guard let filterTransform = GPUFilterRegistry.shared.getFilter(forName: filter) else {
          // TODO log error
          continue
        }
        image = filterTransform(image)
      }
    }
      
    let transparentImage = CIImage(color: CIColor(red: 0, green: 0, blue: 0, alpha: 0))
      .cropped(to: CGRectMake(0, 0, size.width, size.height))
    
    if let tintColor = layer.tintColor {
      let blendFilter = CIFilter.blendWithAlphaMask()
      blendFilter.inputImage = CIImage(color: CIColor(color: tintColor))
        .cropped(to: CGRectMake(0, 0, size.width, size.height))
      blendFilter.backgroundImage = transparentImage
      blendFilter.maskImage = image
      image = blendFilter.outputImage!
    }
    
    if let maskUri = layer.maskUri, var maskImage = layerImages?[.image(uri: maskUri)]  {
      #if targetEnvironment(simulator)
      if inverseOnSimulator  {
        maskImage = adaptImageForSimulator(maskImage)
      }
      #endif
      
      let blendFilter = CIFilter.blendWithMask()
      blendFilter.inputImage = image
      blendFilter.backgroundImage = transparentImage
      blendFilter.maskImage = scaleImage(maskImage, toSize: size)
      image = blendFilter.outputImage!
    }
    
    if let backgroundColor = layer.backgroundColor {
      let backgroundImage = CIImage(color: CIColor(color: backgroundColor))
        .cropped(to: CGRectMake(0, 0, size.width, size.height))
      image = image.composited(over: backgroundImage)
    }
    
    if let underlayImage = underlayImage {
      switch(layer.blending) {
        case .multiply:
          let multiplyBlendMode = CIFilter.multiplyBlendMode()
          multiplyBlendMode.inputImage = image
          multiplyBlendMode.backgroundImage = underlayImage
          
          image = multiplyBlendMode.outputImage!
          break;
        default:
          image = image.composited(over: underlayImage)
          break;
      }
    }
    return image
  }

  private static func degToRad(_ number: Float) -> Float {
    return number * .pi / 180
  }
  
  private static func scaleImage(_ image:CIImage, toSize size: CGSize) -> CIImage {
    var result = image.transformed(by: CGAffineTransform(
      scaleX: size.width / image.extent.width,
      y: size.height / image.extent.height
    ))
    result = result.transformed(by: CGAffineTransform(
      translationX: -result.extent.minX,
      y:  -result.extent.minY
    ))
    return result
  }
  
  #if targetEnvironment(simulator)
  private static func adaptImageForSimulator(_ image: CIImage) -> CIImage {
    return image
      .transformed(by: CGAffineTransform(scaleX: 1, y: -1))
      .transformed(by: CGAffineTransform(translationX: 0, y: image.extent.size.height))
  }

  #endif
}



