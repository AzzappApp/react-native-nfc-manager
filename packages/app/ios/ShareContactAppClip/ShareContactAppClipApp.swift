//
//  ShareContactAppClipApp.swift
//  ShareContactAppClip
//
//  Created by seb on 02/08/2024.
//

import ContactsUI
import SwiftUI

@main
struct ShareContactAppClipApp: App {
  var body: some Scene {
    WindowGroup {
      ContentView()
    }
  }
}

struct ContentView: View {
  @State var username: String?
  @State var showShareBackScreen: Bool = false
  @State var avatarUrl: String?
  @State var contactData: ContactData?
  @State var showPhoneNumberMenu: Bool = false
  @Environment(\.scenePhase) private var scenePhase

  var body: some View {
    ZStack {
      // Background content
      ZStack {
        // WebView in background when username is available
        if let username = username {
          WebView(url: URL(string: "\(Constants.WEB_URL)/\(username)")!)
            .edgesIgnoringSafeArea(.all)
            .ignoresSafeArea(.all)
        }

        if username == nil {
          // Only show static content when there's no username
          VStack {
            Spacer()
            Image("logo_azzapp").padding(.bottom, 25)
            Image("empty")
            Text(NSLocalizedString("Network Better", comment: ""))
              .font(.system(size: 25, weight: .bold))
              .padding(.bottom, 10)
              .padding(.horizontal, 22)

            Text(
              NSLocalizedString(
                "Craft a stunning Digital Business Card to instantly exchange contact details.",
                comment: "")
            )
            .font(.system(size: 14, weight: .medium))
            .padding(.bottom, 10)
            .padding(.horizontal, 22)
            .lineSpacing(4)
            .multilineTextAlignment(.center)
            // App Store download button
            Button(action: openAppStore) {
              Text(NSLocalizedString("create_webcard", comment: ""))
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.white)
                .frame(maxWidth: 225)
                .frame(height: 50)
                .background(Color(hex: "#000000"))
                .cornerRadius(23.5)
            }
            Spacer()
          }
          .frame(maxWidth: .infinity)
          .background(Color.white)
          .padding(.horizontal, 25)
          .transition(.opacity)
        }
        // Floating buttons between WebView and ShareBackScreen
        if let username = username {
          ZStack {
            // WhatsApp button if phone numbers exist
            if let phoneNumbers = contactData?.phoneNumbers, !phoneNumbers.isEmpty {
              if phoneNumbers.count > 1 {
                Button(action: { showPhoneNumberMenu = true }) {
                  Image("whatsapp_icon")
                    .resizable()
                    .frame(width: 42, height: 42)
                    .padding(4)
                    .background(Color(hex: "25D366"))
                    .clipShape(Circle())
                }.position(x: 40, y: UIScreen.main.bounds.height - 40)
              } else if let phoneNumber = phoneNumbers.first?[1], !phoneNumber.isEmpty {
                Button(action: { openWhatsApp(phoneNumber: phoneNumber) }) {
                  Image("whatsapp_icon")
                    .resizable()
                    .frame(width: 42, height: 42)
                    .padding(4)
                    .background(Color(hex: "25D366"))
                    .clipShape(Circle())
                }.position(x: 40, y: UIScreen.main.bounds.height - 40)
              }
            }

            // App Store download button
            Button(action: openAppStore) {
              Text(NSLocalizedString("create_webcard", comment: ""))
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.white)
                .frame(maxWidth: 225)
                .frame(height: 50)
                .background(Color(hex: "0E1216"))
                .opacity(0.6)
                .cornerRadius(23.5)
            }
            .position(x: UIScreen.main.bounds.width / 2, y: UIScreen.main.bounds.height - 40)
          }.ignoresSafeArea(.all)
        }
      }

      // ShareBackScreen on top
      if showShareBackScreen {
        ShareBackScreen(
          isPresented: $showShareBackScreen,
          username: username ?? "",
          avatarUrl: ContactViewControllerDelegateHandler.shared.contactData?.avatarUrl
            ?? avatarUrl,
          contactData: ContactViewControllerDelegateHandler.shared.contactData ?? contactData,
          displayName: {
            let contact = ContactViewControllerDelegateHandler.shared.contactData ?? contactData
            if (contact?.firstName?.isEmpty == false) || (contact?.lastName?.isEmpty == false) {
              return "\(contact?.firstName ?? "") \(contact?.lastName ?? "")".trimmingCharacters(
                in: .whitespaces)
            }
            if let company = contact?.company, !company.isEmpty {
              return company
            }
            return username ?? ""
          }()
        )
        .transition(
          .asymmetric(
            insertion: .move(edge: .bottom).combined(with: .opacity),
            removal: .move(edge: .bottom).combined(with: .opacity)
          )
        )
      }
    }
    .animation(.easeInOut(duration: 0.3), value: showShareBackScreen)
    .onContinueUserActivity(NSUserActivityTypeBrowsingWeb, perform: handleUserActivity)
    .onOpenURL { url in
      if let components = URLComponents(url: url, resolvingAgainstBaseURL: false) {
        let activity = NSUserActivity(activityType: NSUserActivityTypeBrowsingWeb)
        activity.webpageURL = url
        handleUserActivity(activity)
      }
    }
    .sheet(isPresented: $showPhoneNumberMenu) {
      VStack {
        Text("Select a phone number")
          .font(.headline)
          .padding()
        List {
          ForEach(contactData?.phoneNumbers ?? [], id: \.self) { phoneNumber in
            Button(action: {
              openWhatsApp(phoneNumber: phoneNumber[1])
              showPhoneNumberMenu = false
            }) {
              HStack {
                Text(phoneNumber[0])  // Label
                Spacer()
                Text(phoneNumber[1])  // Number
              }
            }
          }
        }
        Button("Cancel") {
          showPhoneNumberMenu = false
        }
        .padding()
      }
    }
  }

  private func openWhatsApp(phoneNumber: String) {
    let whatsappURL = URL(string: "https://wa.me/\(phoneNumber)")!
    UIApplication.shared.open(whatsappURL)
  }

  private func openAppStore() {
    let appStoreURL = URL(string: "https://apps.apple.com/app/6502694267")!
    UIApplication.shared.open(appStoreURL)
  }

  private func resetState() {
    username = nil
    showShareBackScreen = false
    avatarUrl = nil
    contactData = nil
    showPhoneNumberMenu = false
  }

  private func handleUserActivity(_ userActivity: NSUserActivity) {
    // Reset state before handling new activity
    resetState()

    guard let webpageURL = userActivity.webpageURL else {
      return
    }

    // Handle App Clip URL
    if webpageURL.absoluteString.hasPrefix("https://appclip.apple.com") {
      guard let urlComponents = URLComponents(url: webpageURL, resolvingAgainstBaseURL: false),
        let queryItems = urlComponents.queryItems,
        let username = queryItems.first(where: { $0.name == "u" })?.value
      else {
        print("Failed to extract username from App Clip URL")
        return
      }

      // Check for 'c' parameter (old format)
      if let compressedContactCard = queryItems.first(where: { $0.name == "c" })?.value {
        handleContactData(compressedContactCard: compressedContactCard, username: username)
      }
      // Check for 'k' parameter (new format)
      else if let keyData = queryItems.first(where: { $0.name == "k" })?.value {
        handleKeyData(keyData: keyData, username: username)
      }
    }
    // Handle any other URL with username in path
    else {
      // Extract username from path (first non-empty component after /)
      let pathComponents = webpageURL.pathComponents.filter { $0 != "/" }
      guard let username = pathComponents.last else {
        return
      }

      self.username = username
      guard let urlComponents = URLComponents(url: webpageURL, resolvingAgainstBaseURL: false),
        let queryItems = urlComponents.queryItems
      else {
        return
      }

      // Check for 'c' parameter (old format)
      if let compressedContactCard = queryItems.first(where: { $0.name == "c" })?.value {
        handleContactData(compressedContactCard: compressedContactCard, username: username)
      }
      // Check for 'k' parameter (new format)
      else if let keyData = queryItems.first(where: { $0.name == "k" })?.value {
        handleKeyData(keyData: keyData, username: username)
      }
    }
  }

  private func handleKeyData(keyData: String, username: String) {

    // Try new format first (base64 + direct JSON)
    if let decodedBase64 = base64Decode(keyData) {

      // The decoded base64 is already a JSON string, no need for decompression
      guard let jsonData = decodedBase64.data(using: String.Encoding.utf8) else {
        print("Failed to convert to data")
        return
      }

      processJsonData(jsonData, username: username)
      return
    }

    // Fallback to old format (decompression)
    let decodedURI = keyData.removingPercentEncoding ?? ""

    let decompressedData = decompressFromEncodedURIComponent(input: decodedURI)

    guard let jsonData = decompressedData.data(using: String.Encoding.utf8) else {
      print("Failed to convert to data")
      return
    }

    processJsonData(jsonData, username: username)
  }

  private func processJsonData(_ jsonData: Data, username: String) {

    guard let jsonArray = try? JSONSerialization.jsonObject(with: jsonData) as? [Any],
      jsonArray.count >= 2,
      let contactCardAccessId = jsonArray[0] as? String,
      let key = jsonArray[1] as? String
    else {
      print("Failed to parse JSON data")
      return
    }

    // Get geolocation if present
    var geolocation: [Any]? = nil
    if jsonArray.count >= 3 {
      geolocation = jsonArray[2] as? [Any]
    }

    // Call verifyQrCodeKey

    verifyQrCodeKey(
      contactCardAccessId: contactCardAccessId,
      key: key,
      username: username,
      geolocation: geolocation
    ) { result in
      switch result {
      case .success(let response):

        DispatchQueue.main.async {
          self.username = username
          self.avatarUrl = response.avatarUrl

          // Map the contact card data to match the c parameter structure
          if let contactCard = response.contactCard as? [String: Any] {

            var mappedContactData = ContactData()
            mappedContactData.avatarUrl = response.avatarUrl
            mappedContactData.token = response.token
            mappedContactData.profileId = response.profileId

            // Map basic fields
            mappedContactData.firstName = contactCard["firstName"] as? String
            mappedContactData.lastName = contactCard["lastName"] as? String
            mappedContactData.company = contactCard["company"] as? String
            mappedContactData.title = contactCard["title"] as? String

            // Map emails
            if let emails = contactCard["emails"] as? [[String: Any]] {
              mappedContactData.emails = emails.map { email in
                [
                  email["label"] as? String ?? "Home",
                  email["address"] as? String ?? "",
                ]
              }
            }

            // Map phone numbers
            if let phoneNumbers = contactCard["phoneNumbers"] as? [[String: Any]] {
              mappedContactData.phoneNumbers = phoneNumbers.map { phone in
                [
                  phone["label"] as? String ?? "Home",
                  phone["number"] as? String ?? "",
                ]
              }
            }

            // Map addresses
            if let addresses = contactCard["addresses"] as? [[String: Any]] {
              mappedContactData.addresses = addresses.map { address in
                [
                  address["label"] as? String ?? "Home",
                  address["address"] as? String ?? "",
                ]
              }
            }

            // Map birthday
            if let birthday = contactCard["birthday"] as? [String: Any],
              let birthdayStr = birthday["birthday"] as? String
            {
              mappedContactData.birthday = birthdayStr
            }

            // Map socials
            if let socials = contactCard["socials"] as? [[String: Any]] {
              mappedContactData.socials = socials.map { social in
                Social(
                  label: social["label"] as? String ?? "",
                  url: social["url"] as? String ?? ""
                )
              }
            }

            // Map URLs
            if let urls = contactCard["urls"] as? [[String: Any]] {
              mappedContactData.urls = urls.map { url in
                URLData(
                  label: url["label"] as? String ?? "custom",
                  url: url["url"] as? String ?? ""
                )
              }
            }

            // Inject geolocation if present
            if let geolocation = geolocation {
              var geoDict: [String: Any] = [:]
              if let geoArray = geolocation as? [Any], geoArray.count >= 6 {
                geoDict = [
                  "latitude": geoArray[0],
                  "longitude": geoArray[1],
                  "city": geoArray[2],
                  "region": geoArray[3],
                  "subregion": geoArray[4],
                  "country": geoArray[5],
                ]
              }
              mappedContactData.meetingLocation = LocationData(
                latitude: (geoDict["latitude"] as? Double) ?? 0,
                longitude: (geoDict["longitude"] as? Double) ?? 0
              )
              mappedContactData.meetingPlace = MeetingPlaceData(
                city: geoDict["city"] as? String,
                country: geoDict["country"] as? String,
                region: geoDict["region"] as? String,
                subregion: geoDict["subregion"] as? String
              )
            }

            self.contactData = mappedContactData

            // Add contact to address book and show contact controller

            ContactViewControllerDelegateHandler.shared.addContact(
              mappedContactData,
              username: username,
              showShareBackScreen: $showShareBackScreen
            )

          }
        }
      case .failure(let error):
        print("Error verifying QR code key:", error.localizedDescription)
      }
    }
  }

  private func verifyQrCodeKey(
    contactCardAccessId: String,
    key: String,
    username: String,
    geolocation: [Any]?,
    completion: @escaping (Result<QrCodeResponse, Error>) -> Void
  ) {
    guard let url = URL(string: "\(Constants.API_URL)/verifyQrCodeKey") else {
      completion(
        .failure(
          NSError(domain: "", code: -2, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
      return
    }

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("application/json", forHTTPHeaderField: "Accept")

    var json: [String: Any] = [
      "contactCardAccessId": contactCardAccessId,
      "key": key,
      "userName": username,
    ]
    if let geolocation = geolocation {
      json["geolocation"] = geolocation
    }

    do {
      let jsonData = try JSONSerialization.data(withJSONObject: json)
      request.httpBody = jsonData

      URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
          completion(.failure(error))
          return
        }

        guard let data = data else {
          completion(
            .failure(
              NSError(
                domain: "", code: -4, userInfo: [NSLocalizedDescriptionKey: "No data received"])))
          return
        }

        do {
          if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] {
            completion(.success(QrCodeResponse(from: json)))
          } else {
            completion(
              .failure(
                NSError(
                  domain: "", code: -5,
                  userInfo: [NSLocalizedDescriptionKey: "Failed to parse JSON response"])))
          }
        } catch {
          completion(.failure(error))
        }
      }.resume()
    } catch {
      completion(.failure(error))
    }
  }

  struct QrCodeResponse {
    let contactCard: [String: Any]
    let avatarUrl: String?
    let profileId: String
    let displayName: String?
    let token: String?

    init(from json: [String: Any]) {
      self.contactCard = json["contactCard"] as? [String: Any] ?? [:]
      self.avatarUrl = json["avatarUrl"] as? String
      self.profileId = json["profileId"] as? String ?? ""
      self.displayName = json["displayName"] as? String
      self.token = json["token"] as? String
    }
  }

  private func handleContactData(compressedContactCard: String, username: String) {
    self.username = username
    guard let decodedURI = compressedContactCard.removingPercentEncoding else {
      print("Failed to decode URI component.")
      return
    }
    let decompressedContactCard = decompressFromEncodedURIComponent(input: decodedURI)
    guard let jsonData = decompressedContactCard.data(using: .utf8) else {
      print("Failed to convert cleaned string to data.")
      return
    }
    do {
      guard let jsonArray = try JSONSerialization.jsonObject(with: jsonData, options: []) as? [Any]
      else {
        print("Failed to parse JSON array.")
        return
      }

      guard jsonArray.count >= 2 else {
        print("Invalid JSON structure: Expected at least 2 elements, found \(jsonArray.count).")
        return
      }

      guard let contactDataString = jsonArray[0] as? String else {
        print("Invalid JSON structure: First element is not a string.")
        return
      }

      guard let signature = jsonArray[1] as? String else {
        print("Invalid JSON structure: Second element is not a string.")
        return
      }

      // Handle geolocation data if present (3rd element)
      var geolocation: [Any]? = nil
      if jsonArray.count >= 3 {
        geolocation = jsonArray[2] as? [Any]
      }

      verifySign(
        signature: signature, data: contactDataString, salt: username, geolocation: geolocation
      ) { result in
        switch result {
        case .success(let additionalContactData):
          let cleanedContactDataString =
            contactDataString
            .replacingOccurrences(of: "\r", with: "")
            .replacingOccurrences(of: "\n", with: "")
            .replacingOccurrences(of: "\"[", with: "[")
            .replacingOccurrences(of: "]\"", with: "]")
            .replacingOccurrences(of: "\"\"", with: "\"")
          guard let contactDataJSONData = cleanedContactDataString.data(using: .utf8) else {
            print("Failed to convert contact data string to data.")
            return
          }
          do {
            guard
              var contactDataArray = try JSONSerialization.jsonObject(
                with: contactDataJSONData, options: []) as? [Any]
            else {
              print("Failed to parse contact data JSON array.")
              return
            }
            // Inject geolocation as the 11th element (index 10) if present
            if let geolocation = geolocation {
              // Convert geolocation [String: Any] to Data, then to [String: Any] for JSON compatibility
              if let geoData = try? JSONSerialization.data(
                withJSONObject: geolocation, options: []),
                let geoDict = try? JSONSerialization.jsonObject(with: geoData, options: [])
                  as? [String: Any]
              {
                // Ensure the array has at least 11 elements
                while contactDataArray.count < 11 {
                  contactDataArray.append(NSNull())
                }
                contactDataArray[10] = geoDict
              }
            }

            var contactData = mapToContactData(from: contactDataArray)

            if let avatarUrlData = additionalContactData["avatarUrl"] as? String {
              self.avatarUrl = avatarUrlData
              contactData.avatarUrl = avatarUrlData
            }

            if let socialsArray = additionalContactData["socials"] as? [[String: Any]] {
              var socials: [Social] = []
              for socialDict in socialsArray {
                if let label = socialDict["label"] as? String,
                  let url = socialDict["url"] as? String
                {
                  socials.append(Social(label: label, url: url))
                }
              }
              contactData.socials = socials
            }

            if let urlsArray = additionalContactData["urls"] as? [[String: Any]] {
              var urls: [URLData] = []
              for urlDict in urlsArray {
                if let url = urlDict["address"] as? String {
                  urls.append(URLData(label: "custom", url: url))
                }
              }
              contactData.urls = urls
            }

            if let token = additionalContactData["token"] as? String {
              contactData.token = token
            }
            self.contactData = contactData

            DispatchQueue.main.async {
              ContactViewControllerDelegateHandler.shared.addContact(
                contactData,
                username: username,
                showShareBackScreen: $showShareBackScreen
              )
            }
          } catch {
            print("Error parsing contact data JSON: \(error)")
          }
        case .failure(let error):
          print("Error verifying sign-in: \(error.localizedDescription)")
        }
      }
    } catch {
      print("Failed to decode contact data: \(error)")
    }
  }

  func verifySign(
    signature: String,
    data: String,
    salt: String,
    geolocation: [Any]?,
    completion: @escaping (Result<[String: Any], Error>) -> Void
  ) {
    guard let url = URL(string: "\(Constants.API_URL)/verifySign") else {
      completion(
        .failure(
          NSError(domain: "", code: -2, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
      return
    }

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("application/json", forHTTPHeaderField: "Accept")

    var json: [String: Any] = ["signature": signature, "data": data, "salt": salt]
    if let geolocation = geolocation {
      json["geolocation"] = geolocation
    }
    do {
      let jsonData = try JSONSerialization.data(withJSONObject: json, options: [])
      request.httpBody = jsonData
    } catch {
      print("Failed to serialize JSON: \(error.localizedDescription)")

      completion(
        .failure(
          NSError(
            domain: "", code: -31,
            userInfo: [NSLocalizedDescriptionKey: "Failed to parse JSON request"])))
      return
    }

    URLSession.shared.dataTask(with: request) { data, response, error in
      if let error = error {
        completion(.failure(error))
        return
      }
      guard let data = data else {
        completion(
          .failure(
            NSError(domain: "", code: -4, userInfo: [NSLocalizedDescriptionKey: "No data received"])
          ))
        return
      }
      do {
        if let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] {
          completion(.success(json))
        } else {
          completion(
            .failure(
              NSError(
                domain: "", code: -5,
                userInfo: [NSLocalizedDescriptionKey: "Failed to parse JSON response"])))
        }
      } catch {
        completion(.failure(error))
      }
    }.resume()
  }

  // Add base64 decoding function
  private func base64Decode(_ input: String) -> String? {
    // Remove any whitespace
    let trimmed = input.trimmingCharacters(in: .whitespacesAndNewlines)

    // Add padding if needed
    var padded = trimmed
    if padded.count % 4 != 0 {
      padded = padded.padding(toLength: ((trimmed.count + 3) / 4) * 4, withPad: "=", startingAt: 0)
    }

    // Replace URL-safe characters
    let base64 =
      padded
      .replacingOccurrences(of: "-", with: "+")
      .replacingOccurrences(of: "_", with: "/")

    guard let data = Data(base64Encoded: base64) else {
      return nil
    }

    // Try UTF-8 first, fallback to Latin-1 if that fails
     if let utf8String = String(data: data, encoding: .utf8) {
       return utf8String
     } else if let latin1String = String(data: data, encoding: .isoLatin1) {
       return latin1String
     }
     return nil
  }

  struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
      ContentView()
    }
  }
}
