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
    maxSize: CGSize,
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
        generator.appliesPreferredTrackTransform = true
        if (!CGSizeEqualToSize(maxSize, CGSizeZero)) {
          generator.maximumSize = maxSize
        }
        let cgiImage = try generator.copyCGImage(at: time, actualTime: nil)
        let image = CIImage(cgImage: cgiImage);
        generator.cancelAllCGImageGeneration();
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
