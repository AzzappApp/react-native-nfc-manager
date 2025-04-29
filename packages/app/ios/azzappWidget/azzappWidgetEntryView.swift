
import WidgetKit
import SwiftUI

struct QRCodeWidgetEntryView: View {
    @Environment(\.widgetFamily) var widgetFamily
    var entry: Provider.Entry

    private var logoImageName: String {
      switch widgetFamily {
      case .systemSmall:
        switch entry.widgetData.color {
        case "#000000":
          return "azzapp_dark"
        case "#FFFFFF":
          return "azzapp_white"
        default:
          return "azzapp_clear"
        }
        
      case .systemLarge:
        switch entry.widgetData.color {
        case "#000000":
          return "azzapp_large_white"
        case "#FFFFFF":
          return "azzapp_large_dark"
        default:
          return "azzapp_large_clear"
        }
      default:return "azzapp_dark"
      }
    }

    private var backgroundColor: Color {
        return Color(hex: entry.widgetData.color)
    }

    private var tintColor: Color {
        switch entry.widgetData.color {
        case "#000000", "#FFFFFF":
            return .clear
        default:
            return Color(hex: entry.widgetData.textColor)
        }
    }
  
    let scheme = Bundle.main.infoDictionary?["AZZAPP_SCHEME"] as? String  ?? "azzapp"

    @ViewBuilder
    var body: some View { 
      switch widgetFamily {
        case .systemSmall:
          VStack(spacing : 0) {
            ZStack {
              Image(uiImage: UIImage(data: generateQRCode(from: entry.widgetData.url, invert: entry.widgetData.textColor == "#FFFFFF")!)!)
                .interpolation(.none)
                .resizable()
                .scaledToFit()
                .clipShape(RoundedRectangle(cornerRadius: 0))
              ZStack {
                backgroundColor
                Image(logoImageName)
                  .resizable()
                  .renderingMode(entry.widgetData.color == "#000000" || entry.widgetData.color == "#FFFFFF" ? .original : .template) // Conditionally
                  .frame(width: 26, height: 26)
                  .foregroundColor(tintColor)
              }
              .frame(width: 26, height: 26)
              .clipShape(Circle())
            }
          }
          .widgetBackground(backgroundView: BackgroundView(color: Color(hex: entry.widgetData.color)))
          .padding(EdgeInsets(top: 12, leading: 12, bottom: 12, trailing: 12))
         //  case .systemLarge:
        case .systemLarge:
        GeometryReader { geometry in
          let totalWidth = geometry.size.width
          let qrCodeSize = geometry.size.width - 104
          let otherHeight = (geometry.size.height - qrCodeSize) / 2
 
          VStack(spacing : 0) {
            VStack(alignment: .center){
              Image(logoImageName)
                .resizable()
                .renderingMode(entry.widgetData.color == "#000000" || entry.widgetData.color == "#FFFFFF" ? .original : .template) // Conditionally
                .scaledToFit()
                .foregroundColor(tintColor)
                .frame(maxWidth: .infinity, maxHeight: 22, alignment: .center)
            }.frame(width: totalWidth, height: otherHeight).padding(EdgeInsets(top: 04, leading: 0, bottom: 0, trailing: 0))
            Image(uiImage: UIImage(data: generateQRCode(from: entry.widgetData.url, invert: entry.widgetData.textColor == "#FFFFFF")!)!)
              .interpolation(.none)
              .resizable()
              .frame(width: qrCodeSize, height:qrCodeSize)
              .scaledToFit()
            VStack(alignment: .center){
              Text(entry.widgetData.displayName)
                .font(Font.system(size:14, design: .default)).bold()
                .foregroundColor(Color(hex: entry.widgetData.textColor))
                .lineLimit(2) // Limit to 2 lines
                .multilineTextAlignment(.center)
            }.frame( height: otherHeight)
             .padding(EdgeInsets(top: 0, leading: 8, bottom: 4, trailing: 8))
          }
          .widgetBackground(backgroundView: BackgroundView(color: Color(hex: entry.widgetData.color)))
        }
      case .accessoryCircular :
        ZStack {
          Image("QR_code") // Use a system image for testing
             .resizable()
             .scaledToFit()
             .frame(width: 40, height: 40)
        }.containerBackground(.fill, for: .widget)
       .widgetURL(URL(string: "\(scheme)://widget_share"))
  
       default:
           VStack {
           }
       }
    }
 
  }

struct QRCodeWidget: Widget {
  let kind: String = "azzapp"
  
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: Provider()) { entry in
      QRCodeWidgetEntryView(entry: entry)
    }
    .configurationDisplayName("Home screen widgets")
    .description("Instantly share your contact information from your home screen")
    .supportedFamilies([.systemSmall, .systemLarge, .accessoryCircular])
    .disableContentMarginsIfNeeded()
  }
}
  
struct BackgroundView: View {
    var color: Color

    var body: some View {
        Rectangle().fill(color)
    }
}

extension WidgetConfiguration {
    func disableContentMarginsIfNeeded() -> some WidgetConfiguration {
        if #available(iOSApplicationExtension 17.0, *) {
            return self.contentMarginsDisabled()
        } else {
            return self
        }
    }
}

extension View {
   func widgetBackground(backgroundView: some View) -> some View {
       if #available(iOSApplicationExtension 17.0, *) {
           return containerBackground(for: .widget) {
               backgroundView
           }
       } else {
           return background(backgroundView)
       }
   }
}

#Preview(as: .systemSmall) {
    QRCodeWidget()
} timeline: {
  QRCodeWidgetEntry(date: Date(), widgetData: WidgetData(userName: "UserName", url: "https://dev.azzapp.com/dddeaz?c=NoIgOiwRCWDGBbAXgEwI4CYCscAcAXAD2hABoSBzATiwGsBnKlABgCMMAWDk88EAERQoeJAKooAhvgCmwvrxIQFfJcCh8AEgHsE0kXwDUAZiMA2AOxULHZliMkAug9JqS23foj1prAHQoAV1YAGxgAOwABCgQJGGDfOB1HZ2BnMIDg4IdoACcwMLIQFABRAAcABQAVYoBBXHoACw4ARi0ATwbTIwDTAC0GgLQAKwBxXoA3AFkADQB9ABlSqwA5WYBpFGWYNub6EAcgA", color: "#000000", textColor : "#FFFFFF", displayName: "Sebastien azzapp"))
  QRCodeWidgetEntry(date: Date(), widgetData: WidgetData(userName: "Placeholder", url: "https://dev.azzapp.com/dddeaz?c=NoIgOiwRCWDGBbAXgEwI4CYCscAcAXAD2hABoSBzATiwGsBnKlABgCMMAWDk88EAERQoeJAKooAhvgCmwvrxIQFfJcCh8AEgHsE0kXwDUAZiMA2AOxULHZliMkAug9JqS23foj1prAHQoAV1YAGxgAOwABCgQJGGDfOB1HZ2BnMIDg4IdoACcwMLIQFABRAAcABQAVYoBBXHoACw4ARi0ATwbTIwDTAC0GgLQAKwBxXoA3AFkADQB9ABlSqwA5WYBpFGWYNub6EAcgA", color: "#FFFFFF", textColor: "#000000", displayName: "Sebastien azzapp - Company"))
  QRCodeWidgetEntry(date: Date(), widgetData: WidgetData(userName: "Placeholder", url: "https://dev.azzapp.com/dddeaz?c=NoIgOiwRCWDGBbAXgEwI4CYCscAcAXAD2hABoSBzATiwGsBnKlABgCMMAWDk88EAERQoeJAKooAhvgCmwvrxIQFfJcCh8AEgHsE0kXwDUAZiMA2AOxULHZliMkAug9JqS23foj1prAHQoAV1YAGxgAOwABCgQJGGDfOB1HZ2BnMIDg4IdoACcwMLIQFABRAAcABQAVYoBBXHoACw4ARi0ATwbTIwDTAC0GgLQAKwBxXoA3AFkADQB9ABlSqwA5WYBpFGWYNub6EAcgA", color: "#EBF459", textColor: "#000000", displayName: "Sebastien - Minitère de l'interieur"))
  QRCodeWidgetEntry(date: Date(), widgetData: WidgetData(userName: "Placeholder", url: "https://dev.azzapp.com/dddeaz?c=NoIgOiwRCWDGBbAXgEwI4CYCscAcAXAD2hABoSBzATiwGsBnKlABgCMMAWDk88EAERQoeJAKooAhvgCmwvrxIQFfJcCh8AEgHsE0kXwDUAZiMA2AOxULHZliMkAug9JqS23foj1prAHQoAV1YAGxgAOwABCgQJGGDfOB1HZ2BnMIDg4IdoACcwMLIQFABRAAcABQAVYoBBXHoACw4ARi0ATwbTIwDTAC0GgLQAKwBxXoA3AFkADQB9ABlSqwA5WYBpFGWYNub6EAcgA", color: "#812341", textColor: "#FFFFFF", displayName: "Company"))
}

#Preview(as: .systemLarge) {
    QRCodeWidget()
} timeline: {
  QRCodeWidgetEntry(date: Date(), widgetData: WidgetData(userName: "UserName", url: "https://dev.azzapp.com/dddeaz?c=NoIgOiwRCWDGBbAXgEwI4CYCscAcAXAD2hABoSBzATiwGsBnKlABgCMMAWDk88EAERQoeJAKooAhvgCmwvrxIQFfJcCh8AEgHsE0kXwDUAZiMA2AOxULHZliMkAug9JqS23foj1prAHQoAV1YAGxgAOwABCgQJGGDfOB1HZ2BnMIDg4IdoACcwMLIQFABRAAcABQAVYoBBXHoACw4ARi0ATwbTIwDTAC0GgLQAKwBxXoA3AFkADQB9ABlSqwA5WYBpFGWYNub6EAcgA", color: "#000000", textColor : "#FFFFFF", displayName: "Sebastien azzapp"))
  QRCodeWidgetEntry(date: Date(), widgetData: WidgetData(userName: "Placeholder", url: "https://dev.azzapp.com/dddeaz?c=NoIgOiwRCWDGBbAXgEwI4CYCscAcAXAD2hABoSBzATiwGsBnKlABgCMMAWDk88EAERQoeJAKooAhvgCmwvrxIQFfJcCh8AEgHsE0kXwDUAZiMA2AOxULHZliMkAug9JqS23foj1prAHQoAV1YAGxgAOwABCgQJGGDfOB1HZ2BnMIDg4IdoACcwMLIQFABRAAcABQAVYoBBXHoACw4ARi0ATwbTIwDTAC0GgLQAKwBxXoA3AFkADQB9ABlSqwA5WYBpFGWYNub6EAcgA", color: "#FFFFFF", textColor: "#000000", displayName: "Sebastien azzapp - Company"))
  QRCodeWidgetEntry(date: Date(), widgetData: WidgetData(userName: "Placeholder", url: "https://dev.azzapp.com/dddeaz?c=NoIgOiwRCWDGBbAXgEwI4CYCscAcAXAD2hABoSBzATiwGsBnKlABgCMMAWDk88EAERQoeJAKooAhvgCmwvrxIQFfJcCh8AEgHsE0kXwDUAZiMA2AOxULHZliMkAug9JqS23foj1prAHQoAV1YAGxgAOwABCgQJGGDfOB1HZ2BnMIDg4IdoACcwMLIQFABRAAcABQAVYoBBXHoACw4ARi0ATwbTIwDTAC0GgLQAKwBxXoA3AFkADQB9ABlSqwA5WYBpFGWYNub6EAcgA", color: "#EBF459", textColor: "#000000", displayName: "Sebastien Hecart - Minitère de l'interieur"))
  QRCodeWidgetEntry(date: Date(), widgetData: WidgetData(userName: "Placeholder", url: "https://dev.azzapp.com/dddeaz?c=NoIgOiwRCWDGBbAXgEwI4CYCscAcAXAD2hABoSBzATiwGsBnKlABgCMMAWDk88EAERQoeJAKooAhvgCmwvrxIQFfJcCh8AEgHsE0kXwDUAZiMA2AOxULHZliMkAug9JqS23foj1prAHQoAV1YAGxgAOwABCgQJGGDfOB1HZ2BnMIDg4IdoACcwMLIQFABRAAcABQAVYoBBXHoACw4ARi0ATwbTIwDTAC0GgLQAKwBxXoA3AFkADQB9ABlSqwA5WYBpFGWYNub6EAcgA", color: "#812341", textColor: "#FFFFFF", displayName: "Nico Designer - Inspecteur de mouche infecté par le covid"))
}

//TODO: test again without using the convert to uiImage to Data the use UiImage
func generateQRCode(from string: String, invert: Bool) -> Data? {
  let filter = CIFilter.qrCode(from: string, correctionLevel: "L")
  let scale = UIScreen.main.scale
  
  let transform = CGAffineTransform(scaleX: scale, y: scale)
  var ciImage = filter?.outputImage?.transformed(by: transform)
  if (invert) {
    ciImage = ciImage?.transparent
  } else {
    ciImage = ciImage?.tinted(using: .black)
  }
  let qrImage = UIImage(ciImage: ciImage!)
  
  return qrImage.pngData()
}
