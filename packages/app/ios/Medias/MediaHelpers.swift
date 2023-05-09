//
//  MediaPrefetcher.swift
//  azzapp
//
//  Created by François de Campredon on 04/05/2023.
//

import Foundation
import Nuke
import AVFoundation
import Photos
import Vision
import CoreImage
import UIKit


@objc(AZPMediaHelpers)
class MediaHelpers: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func getVideoSize(_ uri: NSURL, resolve: @escaping RCTPromiseResolveBlock, reject:  @escaping RCTPromiseRejectBlock) {
    let asset = AVURLAsset(url: uri as URL)
    guard let track = asset.tracks(withMediaType: .video).first else {
      reject("FAILURE", "No video track", nil);
      return
    }
    resolve(["width": track.naturalSize.width, "height": track.naturalSize.height]);
  }
  
  @objc
  func getPHAssetPath(_ internalId:NSString, resolve:  @escaping RCTPromiseResolveBlock, reject:  @escaping RCTPromiseRejectBlock) {
    var mediaIdentifier = internalId as String
    if mediaIdentifier.starts(with: "ph://")  {
      mediaIdentifier = mediaIdentifier.replacingOccurrences(of: "ph://", with: "")
    }
    
    guard let asset = PHAsset.fetchAssets(withLocalIdentifiers: [mediaIdentifier], options: nil).firstObject else {
      reject("NOT_FOUND", "Asset not found",  nil)
      return
    }

    let assetResources = PHAssetResource.assetResources(for: asset)
    if assetResources.first == nil {
        return
    }
    var filePath = ""
    let editOptions = PHContentEditingInputRequestOptions()
    // Download asset if on icloud.
    editOptions.isNetworkAccessAllowed = true

    asset.requestContentEditingInput(with: editOptions) { contentEditingInput, infos in
      var imageURL = contentEditingInput?.fullSizeImageURL
      if let audiovisualAsset = contentEditingInput?.audiovisualAsset as? AVURLAsset {
          imageURL = audiovisualAsset.url as URL
      }
      if let imageURL = imageURL, imageURL.absoluteString.count != 0 {
          filePath = imageURL.absoluteString.replacingOccurrences(of: "pathfile:", with: "file:")
          resolve(filePath)
      } else {
          let errorMessage = String.init(format: "Failed to load asset with localIdentifier %@ with no error message.", internalId)
          let error = RCTErrorWithMessage(errorMessage)
          reject("Error while getting file path", "Error while getting file path", error)
      }
    }
  }
  
  @objc
  func segmentImage(_ uri: NSURL, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard #available(iOS 15.0, *) else {
      reject("failure", "Unsupported OS version", nil)
      return;
    }
    DispatchQueue.global(qos: .default).async {
      let ciContext = CIContext(options: nil)
      let segmentationRequest = VNGeneratePersonSegmentationRequest()
      segmentationRequest.qualityLevel = .accurate
      
      #if targetEnvironment(simulator)
      segmentationRequest.usesCPUOnly = true
      #endif
      
      let requestHandler = VNImageRequestHandler(url: uri as URL, options: [VNImageOption.ciContext: ciContext])
      
      do {
        try requestHandler.perform([segmentationRequest])
        
        guard let result = segmentationRequest.results?.first as? VNPixelBufferObservation else {
          reject("failure", "No result from segmentation", nil)
          return
        }
        
        let maskImage = CIImage(cvPixelBuffer: result.pixelBuffer)
        let colorSpaceRGB = CGColorSpaceCreateDeviceRGB()
        
        guard let imageData = ciContext.pngRepresentation(of: maskImage, format: .BGRA8, colorSpace: colorSpaceRGB, options: [:]) else {
          reject("failure", "Error converting CIImage to NSData", nil)
          return
        }
        
        let fileUrl = FileUtils.getRanfomFileURL(withExtension: "png")
        do {
          try imageData.write(to: fileUrl)
        } catch {
          reject("Failure", "Could not write image data", error)
          return;
        }
        resolve(fileUrl.path)
      } catch let error {
        reject("failure", "Error during segmentation", error)
      }
    }
  }
  
  @objc
  func getAvailableFonts(_ callback: RCTResponseSenderBlock) {
    var fontFamilyNames = [String]()

    for familyName in UIFont.familyNames {
      fontFamilyNames.append(familyName)
    }
    callback([fontFamilyNames]);
  }
}

