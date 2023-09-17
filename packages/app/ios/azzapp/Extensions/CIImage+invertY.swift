//
//  CIImage+invertY.swift
//  azzapp
//
//  Created by François de Campredon on 27/04/2023.
//

import Foundation


extension CIImage {
  
  func inverseY() -> CIImage {
    return self
          .transformed(by: CGAffineTransform(scaleX: 1, y: -1))
          .transformed(by: CGAffineTransform(translationX: 0, y: self.extent.height))
  }
}
