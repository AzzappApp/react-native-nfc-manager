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
    maxSize: CGSize,
    onSuccess: @escaping (_ image: CIImage) -> Void,
    onError: @escaping (_ error: NSError?) -> Void
  ) {
    guard let url = URL(string: url as String) else {
      let error = NSError(domain: "com.azzapp.app", code: 0, userInfo: [
        NSLocalizedDescriptionKey: "Failed to parse url",
      ])
      onError(error)
      return
    }

    Task.detached {
      do {
        let data = try Data(contentsOf: url)
        
        guard let uiImage = UIImage(data: data) else {
          let error = NSError(domain: "com.azzapp.app", code: 0, userInfo: [
            NSLocalizedDescriptionKey: "Failed to handle image",
          ])
          onError(error)
          return
        }
        
        guard var ciImage = CIImage(image: uiImage)?.oriented(CGImagePropertyOrientation(uiImage.imageOrientation)) else {
          let error = NSError(domain: "com.azzapp.app", code: 0, userInfo: [
            NSLocalizedDescriptionKey: "Failed to create CIImage",
          ])
          onError(error)
          return
        }

        if !CGSizeEqualToSize(maxSize, CGSize.zero) {
          let aspectRatio = ciImage.extent.width / ciImage.extent.height
          if aspectRatio > 1 {
            ciImage = ciImage.transformed(by: CGAffineTransform(
              scaleX: maxSize.width / ciImage.extent.width,
              y: maxSize.width / ciImage.extent.width))
          } else {
            ciImage = ciImage.transformed(by: CGAffineTransform(
              scaleX: maxSize.height / ciImage.extent.height,
              y: maxSize.height / ciImage.extent.height))
          }
        }

        onSuccess(ciImage)

      } catch {
        let error = NSError(domain: "com.azzapp.app", code: 0, userInfo: [
          NSLocalizedDescriptionKey: "Failed to load image data",
          NSUnderlyingErrorKey: error
        ])
        onError(error)
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
