//
//  lockscreenScanWidget.swift
//  azzapp
//
//  Created by Sebastien on 01/03/2025.
//

import WidgetKit
import SwiftUI

struct LockScreenScanWidget: Widget {
    let kind: String = "com.azzapp.lockScreenScanWidget"

    var body: some WidgetConfiguration {
      StaticConfiguration(kind: kind, provider: ScanProvider()) { entry in
        LockScreenScanWidgetView(entry: entry).containerBackground(.fill, for: .widget)
      }
      .configurationDisplayName("Azzapp Scan Widget")
      .description("Scan a contact card easily with this widget.")
      .supportedFamilies([.accessoryCircular])
    }
}


struct LockScreenScanWidgetView: View {
    var entry: ScanProvider.Entry
    let scheme = Bundle.main.infoDictionary?["AZZAPP_SCHEME"] as? String  ?? "azzapp"
    var body: some View {
        ZStack {
          Image("scan") // Use a system image for testing
             .resizable()
             .scaledToFit()
             .frame(width: 40, height: 40)
        }
       .widgetURL(URL(string: "\(scheme)://scan")) // Custom URL scheme to open the app on a special page, our 3 build target use the same url-scheme
    }
}


struct ScanEntry: TimelineEntry {
    let date: Date
}

struct ScanProvider: TimelineProvider {
    func placeholder(in context: Context) -> ScanEntry {
      ScanEntry(date: Date())
    }

    func getSnapshot(in context: Context, completion: @escaping (ScanEntry) -> Void) {
        completion(ScanEntry(date: Date()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ScanEntry>) -> Void) {
        let entry = ScanEntry(date: Date())
        let timeline = Timeline(entries: [entry], policy: .never) // No updates needed
        completion(timeline)
    }
}

#Preview(as: .accessoryCircular) {
    LockScreenScanWidget()
} timeline: {
    ScanEntry(date: Date())
}
