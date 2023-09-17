//
//  AZPTransformationRegistry.swift
//  azzapp
//
//  Created by François de Campredon on 07/04/2023.
//

import Foundation


typealias GPULayerFilter = (CIImage) -> CIImage


class GPUFilterRegistry {

  static let shared = GPUFilterRegistry()

  private var transformations: [String: GPULayerFilter]
  
  
  private init() {
    transformations = [
      "chrome": { image in image.applyingFilter("CIPhotoEffectChrome") },
      "fade": { image in image.applyingFilter("CIPhotoEffectFade") },
      "instant": { image in image.applyingFilter("CIPhotoEffectInstant") },
      "noir": { image in image.applyingFilter("CIPhotoEffectProcess") },
      "process": { image in image.applyingFilter("CIPhotoEffectProcess") },
      "tonal": { image in image.applyingFilter("CIPhotoEffectTonal") },
      "transfer": { image in image.applyingFilter("CIPhotoEffectTransfer") },
      "sepia": { image in image.applyingFilter("CISepiaTone", parameters: [ "inputIntensity": 1.0 ]) },
      "thermal": { image in image.applyingFilter("CIThermal") },
      "xray": { image in image.applyingFilter("CIXRay") },
    ]
  }
  
  func registerFilter(_ filter: @escaping GPULayerFilter, withName name: String) {
    transformations[name] = filter
  }
  
  func getFilter(forName name: String) -> GPULayerFilter? {
    return transformations[name]
  }
}


