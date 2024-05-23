//
//  CVPixelLoader.swift
//  azzapp
//
//  Created by François de Campredon on 12/05/2024.
//

import Foundation


@objc(AZPCIImageLoader)
class CIImageLoader: NSObject {
  
  @objc
  static func loadImage(
    url: NSString,
    onSuccess: @escaping (_ image: CIImage) -> Void,
    onError: @escaping (_ error: NSError?
  ) -> Void) {
    let url = URL(string: url as String)
    Task.detached {
      guard let url = url else {
        let error = NSError(domain: "com.azzapp.app", code: 0, userInfo: [
          NSLocalizedDescriptionKey: "Failed to parse url",
        ]);
        onError(error);
        return;
      }
      do {
        let image = try await MediaPipeline.pipeline.image(for: url);
        guard let ciImage = CIImage(image: image)?.oriented(CGImagePropertyOrientation(image.imageOrientation)) else {
          let error = NSError(domain: "com.azzapp.app", code: 0, userInfo: [
            NSLocalizedDescriptionKey: "Failed to handle image",
          ]);
          onError(error);
          return;
        }
        onSuccess(ciImage)
      } catch {
        let nsError = NSError(domain: "com.azzapp.app", code: 0, userInfo: [
          NSLocalizedDescriptionKey: error.localizedDescription,
        ]);
        onError(nsError);
      }
    }
  }
  
  @objc
  static func loadVideoThumbnail(
    url: NSString,
    time: CMTime,
    onSuccess: @escaping (_ image: CIImage) -> Void,
    onError: @escaping (_ error: NSError?
  ) -> Void) {
    let url = URL(string: url as String)
    Task.detached {
      guard let url = url else {
        let error = NSError(domain: "com.azzapp.app", code: 0, userInfo: [
          NSLocalizedDescriptionKey: "Failed to parse url",
        ]);
        onError(error);
        return;
      }
      do {
        let asset = AVAsset(url: url)
        let generator = AVAssetImageGenerator(asset: asset)
        guard let videoTrack = try await asset.loadTracks(withMediaType: .video).first else  {
          let error = NSError(domain: "com.azzapp.app", code: 0, userInfo: [
            NSLocalizedDescriptionKey: "Failed to load video thumbnail",
          ]);
          onError(error);
          return;
        }
         
        let orientationTransform = videoTrack.orientationTransform
        let cgiImage = try generator.copyCGImage(at: time, actualTime: nil)
        var image = CIImage(cgImage: cgiImage);
        image = image.transformed(by: orientationTransform)
        image = image.transformed(by: CGAffineTransform(
          translationX: -image.extent.origin.x,
          y: -image.extent.origin.y
        ))
        onSuccess(image)
      } catch {
        let nsError = NSError(domain: "com.azzapp.app", code: 0, userInfo: [
          NSLocalizedDescriptionKey: error.localizedDescription,
        ]);
        onError(nsError);
      }
    }
  }
}
