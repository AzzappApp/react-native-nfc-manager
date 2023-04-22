//
//  AVAssetTrack+imageTransform.swift
//  azzapp
//
//  Created by François de Campredon on 05/04/2023.
//

import Foundation
import AVFoundation.AVAssetTrack

extension AVAssetTrack {
 
  var orientation: UIImage.Orientation {
    get {
      let t = self.preferredTransform;
      if (t.a == 0 && t.b == 1.0 && t.d == 0) {
        return .up;
      } else if (t.a == 0 && t.b == -1.0 && t.d == 0) {
        return .down;
      } else if (t.a == 1.0 && t.b == 0 && t.c == 0) {
        return .right;
      } else if (t.a == -1.0 && t.b == 0 && t.c == 0) {
        return .left;
      }
      return .up;
    }
  }
 
  var orientationTransform: CGAffineTransform {
    get {
      switch(orientation) {
       case .up:
         return CGAffineTransformMakeRotation(-.pi/2);
       case .upMirrored:
         return CGAffineTransformScale(CGAffineTransformMakeRotation(-.pi/2), -1, 1);
       case .down:
         return CGAffineTransformMakeRotation(.pi/2);
       case .downMirrored:
         return CGAffineTransformScale(CGAffineTransformMakeRotation(.pi/2), -1, 1);
       case .left:
         return CGAffineTransformMakeRotation(.pi);
       case .leftMirrored:
         return CGAffineTransformScale(CGAffineTransformMakeRotation(.pi), 1, -1);
       case .right:
         return CGAffineTransformIdentity;
       case .rightMirrored:
         return CGAffineTransformMakeScale(1, -1);
       default:
         return CGAffineTransformMakeRotation(-.pi/2);
      }
    }
  }
}
