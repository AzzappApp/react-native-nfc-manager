//
//  MediaPrefetcher.swift
//  azzapp
//
//  Created by François de Campredon on 04/05/2023.
//

import Foundation
import AVFoundation
import Photos


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
  
}

