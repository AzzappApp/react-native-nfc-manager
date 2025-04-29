import WidgetKit
import SwiftUI
import AppIntents

struct WidgetData: Decodable {
    let userName: String
    let url: String
    let color: String
    let textColor: String
    let displayName : String
}

struct Provider: AppIntentTimelineProvider {
  static var storedData: [WidgetData] = []

   static func fetchData() {
        //use the prod app group identifier in case of issue building
        let sharedGroup = Bundle.main.infoDictionary?["SHARED_GROUP_IDENTIFIER"] as? String  ?? "group.azzapp.app.widget"
        let userDefaults = UserDefaults(suiteName: sharedGroup )
        if let savedData = userDefaults?.value(forKey: "azzapp-qrcode-widget_v1") as? String {
            let decoder = JSONDecoder()
            if let data = savedData.data(using: .utf8) {
                do {
                  storedData = try decoder.decode([WidgetData].self, from: data)
                } catch {
                    storedData = []
                    print("Could not parse data: \(error)")
                }
            }
        }
    }

    func placeholder(in context: Context) -> QRCodeWidgetEntry {
      QRCodeWidgetEntry(date: Date(), widgetData: WidgetData(userName: "azzapp", url: "https://web.azzapp.com", color: "#FFFFFF", textColor: "#000000", displayName: "azzapp - Digital Business Card"))
    }

    func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> QRCodeWidgetEntry {
        let exampleData = WidgetData(userName: "azzapp", url: "https://web.azzapp.com", color: "#FFFFFF", textColor: "#000000",displayName: "azzapp - Digital Business Card")
        return QRCodeWidgetEntry(date: Date(), widgetData: exampleData)
    }

    func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<QRCodeWidgetEntry> {
        Provider.fetchData()
        var entries: [QRCodeWidgetEntry] = []

        let entryDate = Date()
        var widgetData: WidgetData?

        if let selectedUserName = configuration.selectedUserName, !selectedUserName.isEmpty {
            widgetData = Provider.storedData.first(where: { $0.userName == selectedUserName })
        }

        if widgetData == nil, !Provider.storedData.isEmpty {
       
           widgetData = Provider.storedData.first
          if let widgetData = widgetData{
            configuration.selectedUserName = widgetData.userName
          }
        }

        if let widgetData = widgetData {
           let color: String
            let textColor: String

            switch configuration.theme {
            case .dark:
                color = "#000000"
                textColor = "#FFFFFF"
            case .white:
                color = "#FFFFFF"
                textColor = "#000000"
            case .primary:
                color = widgetData.color
                textColor = widgetData.textColor
            }
          
          let themedWidgetData = WidgetData(userName: widgetData.userName, url: widgetData.url, color: color, textColor: textColor, displayName: widgetData.displayName)
          let entry = QRCodeWidgetEntry(date: entryDate, widgetData: themedWidgetData)
          entries.append(entry)
        } else {
            // If no data is found, provide a default entry
            configuration.selectedUserName = nil
            let entry = QRCodeWidgetEntry(date: Date(), widgetData: WidgetData(userName: "azzapp", url: "https://web.azzapp.com", color: "#FFFFFF", textColor: "#000000", displayName: "azzapp - Digital Business Card"))
            entries.append(entry)
        }
        let timeline = Timeline(entries: entries, policy: .atEnd)
        return timeline
    }
}

struct QRCodeWidgetEntry: TimelineEntry {
    let date: Date
    let widgetData: WidgetData
}
