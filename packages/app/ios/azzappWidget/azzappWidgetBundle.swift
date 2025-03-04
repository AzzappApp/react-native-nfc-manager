//
//  QRCodeWidgetBundle.swift
//  QRCodeWidget
//
//  Created by Sebastien Hecart on 16/12/2024.
//

import WidgetKit
import SwiftUI

@main
struct QRCodeWidgetBundle: WidgetBundle {
    var body: some Widget {
        QRCodeWidget()
        LockScreenScanWidget()
    }
}
