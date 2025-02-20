//
//  CIFilter.swift
//  azzapp
//
//  Created by Sebastien Hecart on 17/12/2024.
//

import CoreImage

extension CIFilter {
    static func qrCode(from string: String, correctionLevel: String = "M") -> CIFilter? {
        guard let data = string.data(using: .ascii, allowLossyConversion: false) else { return nil }
        guard let filter = CIFilter(name: "CIQRCodeGenerator") else { return nil }
        
        filter.setValue(data, forKey: "inputMessage")
        filter.setValue(correctionLevel, forKey: "inputCorrectionLevel")
        
        return filter
    }
}
