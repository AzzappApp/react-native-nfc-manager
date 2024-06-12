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
    maxSize: NSNumber?,
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
        guard var ciImage = CIImage(image: image)?.oriented(CGImagePropertyOrientation(image.imageOrientation)) else {
          let error = NSError(domain: "com.azzapp.app", code: 0, userInfo: [
            NSLocalizedDescriptionKey: "Failed to handle image",
          ]);
          onError(error);
          return;
        }
       // Only resize the image if targetSize is not null
        if let maxSize = maxSize {
          
          let maxSize = CGFloat(truncating: maxSize)
          // Create a CIFilter to scale the image
        
          
          // Calculate the scale factor
          let scaleFactor = min(maxSize / ciImage.extent.width, maxSize / ciImage.extent.height)
          
          ciImage = ciImage.transformed(by: CGAffineTransform(scaleX: scaleFactor, y: scaleFactor))
          
          onSuccess(ciImage)
        } else {
          // If targetSize is null, return the original image
          onSuccess(ciImage)
        }
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
