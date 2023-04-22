//
//  GPUViewError.swift
//  azzapp
//
//  Created by François de Campredon on 18/04/2023.
//

import Foundation


enum GPUViewError: Error {

  static let FAILED_TO_EXPORT_CODE = "FAILED_TO_EXPORT"
  static let FAILED_TO_LOAD_CODE = "FAILED_TO_LOAD"
  static let NO_VIDEO_TRACK_CODE = "NO_VIDEO_TRACK"
  static let UNKNOWN_ERROR_CODE = "UNKNOWN_ERROR"
  static let PLAYER_ERROR_CODE = "PLAYER_ERROR"
  
  case noVideoTrack(url: URL)
  case failedToLoad(GPULayerSource)
  case failedToExport
  
  
  var code: String {
    switch self {
      case .noVideoTrack: return GPUViewError.NO_VIDEO_TRACK_CODE;
      case .failedToLoad: return GPUViewError.FAILED_TO_LOAD_CODE;
      case .failedToExport: return GPUViewError.FAILED_TO_EXPORT_CODE;
    }
  }
  
  var message: String {
    switch self {
      case .noVideoTrack(url: let url):
        return "Trying to load a frame from a video with url: '\(url)' that contains no video track"
      case .failedToLoad(source: let source):
        return  "Failed to load image for layer : '\(source.stringRepresentation)'"
      case .failedToExport:
        return  "Failed to export image"
    }
  }
}
