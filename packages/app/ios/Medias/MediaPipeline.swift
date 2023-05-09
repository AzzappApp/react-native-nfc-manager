//
//  MediaPipeline.swift
//  azzapp
//
//  Created by François de Campredon on 03/05/2023.
//

import Foundation
import Nuke
import AVFoundation


class MediaPipeline {
  private static var  _pipeline: ImagePipeline!
  private static var _initialized = false
  
  static var pipeline: ImagePipeline {
    initialize()
    return _pipeline
  }
  
  static func initialize() {
    if (!_initialized) {
      _initialized = true
      _pipeline = ImagePipeline(configuration: .withDataCache)
    }
  }
}
