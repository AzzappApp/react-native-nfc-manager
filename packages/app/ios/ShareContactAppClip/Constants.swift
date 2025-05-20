import Foundation

struct Constants {
  static let API_URL = Bundle.main.infoDictionary?["AZZAPP_API_URL"] as? String  ?? "https://api.azzapp.com";
  static let WEB_URL = Bundle.main.infoDictionary?["AZZAPP_WEB_URL"] as? String  ?? "https://www.azzapp.com";
}
