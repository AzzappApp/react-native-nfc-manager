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

  var body: some View {
    ZStack {
      if showShareBackScreen {
        ShareBackScreen(
          isPresented: $showShareBackScreen,
          username: username ?? "",
          avatarUrl: avatarUrl,
          contactData: contactData
        )
        .transition(.opacity.combined(with: .move(edge: .bottom)))
        .zIndex(1)
      } else {
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
          Spacer()
        }
        .frame(maxWidth: .infinity)
        .background(Color.white)
        .padding(.horizontal, 25)
        .onContinueUserActivity(NSUserActivityTypeBrowsingWeb, perform: handleUserActivity)
        .transition(.opacity)
        .zIndex(0)
      }
    }
    .animation(.easeInOut(duration: 0.3), value: showShareBackScreen)
  }

  private func handleUserActivity(_ userActivity: NSUserActivity) {
    guard let webpageURL = userActivity.webpageURL else {
      return
    }

    if webpageURL.absoluteString.hasPrefix("https://appclip.apple.com") {
      guard let urlComponents = URLComponents(url: webpageURL, resolvingAgainstBaseURL: false),
        let queryItems = urlComponents.queryItems,
        let compressedContactCard = queryItems.first(where: { $0.name == "c" })?.value,
        let username = queryItems.first(where: { $0.name == "u" })?.value
      else {
        return
      }
      handleContactData(compressedContactCard: compressedContactCard, username: username)
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
      var geolocation: [String: Any]? = nil
      if jsonArray.count >= 3, let geoDict = jsonArray[2] as? [String: Any] {
        geolocation = geoDict
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
              addContact(contactData, username: username)
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

  private func addContact(_ contactData: ContactData, username: String) {
    let contact = CNMutableContact()
    contact.givenName = contactData.firstName ?? ""
    contact.familyName = contactData.lastName ?? ""
    contact.organizationName = contactData.company ?? ""
    contact.jobTitle = contactData.title ?? ""

    if let emails = contactData.emails {
      contact.emailAddresses = emails.map { email in
        CNLabeledValue(label: email[0], value: email[1] as NSString)
      }
    }

    if let phoneNumbers = contactData.phoneNumbers {
      contact.phoneNumbers = phoneNumbers.map { phoneNumber in
        CNLabeledValue(label: phoneNumber[0], value: CNPhoneNumber(stringValue: phoneNumber[1]))
      }
    }

    if let addresses = contactData.addresses {
      contact.postalAddresses = addresses.map { address in
        let postalAddress = CNMutablePostalAddress()
        postalAddress.street = address[1]
        return CNLabeledValue(label: address[0], value: postalAddress)
      }
    }

    if let birthday = contactData.birthday {
      // Remove "Optional(" and ")" from the string if present
      let cleanedBirthday =
        birthday
        .replacingOccurrences(of: "Optional(\"", with: "")
        .replacingOccurrences(of: "\")", with: "")

      let dateFormatter = DateFormatter()
      dateFormatter.dateFormat = "yyyy-MM-dd"
      dateFormatter.timeZone = TimeZone(secondsFromGMT: 0)

      if let date = dateFormatter.date(from: cleanedBirthday) {
        let calendar = Calendar.current
        var components = DateComponents()
        components.calendar = calendar
        components.year = calendar.component(.year, from: date)
        components.month = calendar.component(.month, from: date)
        components.day = calendar.component(.day, from: date)
        contact.birthday = components
      }
    }

    if let socials = contactData.socials {
      contact.socialProfiles = socials.map { social in
        CNLabeledValue(
          label: social.label,
          value: CNSocialProfile(
            urlString: social.url, username: social.url, userIdentifier: nil, service: social.label)
        )
      }
    }

    var urlAddresses = [CNLabeledValue<NSString>]()
    if let urls = contactData.urls {
      urlAddresses = urls.map { urlData in
        CNLabeledValue(label: urlData.label, value: urlData.url as NSString)
      }
    }

    let baseUrl = "https://www.azzapp.com/"
    urlAddresses.append(CNLabeledValue(label: "Azzapp", value: "\(baseUrl)\(username)" as NSString))
    contact.urlAddresses = urlAddresses
    contact.note = NSLocalizedString("Made with Azzapp", comment: "")

    if let avatarUrl = contactData.avatarUrl, let url = URL(string: avatarUrl) {
      URLSession.shared.dataTask(with: url) { data, response, error in
        if let data = data {
          contact.imageData = data
        }

        DispatchQueue.main.async {
          ContactViewControllerDelegateHandler.shared.presentContactViewController(
            with: contact, username: username, showShareBackScreen: $showShareBackScreen)
        }
      }.resume()
    } else {
      ContactViewControllerDelegateHandler.shared.presentContactViewController(
        with: contact, username: username, showShareBackScreen: $showShareBackScreen)
    }
  }
}

class ContactViewControllerDelegateHandler: NSObject, CNContactViewControllerDelegate {
  static let shared = ContactViewControllerDelegateHandler()

  var username: String?
  var showShareBackScreen: Binding<Bool>?

  func presentContactViewController(
    with contact: CNMutableContact, username: String, showShareBackScreen: Binding<Bool>
  ) {
    let contactViewController = CNContactViewController(forNewContact: contact)
    contactViewController.delegate = self
    self.username = username
    self.showShareBackScreen = showShareBackScreen

    let viewController = UIApplication.shared.windows.first?.rootViewController
    viewController?.present(
      UINavigationController(rootViewController: contactViewController), animated: true)
  }

  func contactViewController(
    _ viewController: CNContactViewController, didCompleteWith contact: CNContact?
  ) {
    viewController.dismiss(animated: true) {
      self.showShareBackScreen?.wrappedValue = true
    }
  }
}

struct ContactData: Codable {
  var profileId: String?
  var webCardId: String?
  var firstName: String?
  var lastName: String?
  var company: String?
  var title: String?
  var emails: [[String]]?
  var phoneNumbers: [[String]]?
  var addresses: [[String]]?
  var birthday: String?
  var avatarUrl: String?
  var socials: [Social]?
  var urls: [URLData]?
  var token: String?
  var meetingLocation: LocationData?
  var meetingPlace: MeetingPlaceData?
}

struct LocationData: Codable {
  var latitude: Double
  var longitude: Double
}

struct MeetingPlaceData: Codable {
  var city: String?
  var country: String?
  var region: String?
  var subregion: String?
}

struct Social: Codable {
  var label: String
  var url: String
}

struct URLData: Codable {
  var label: String
  var url: String
}

private func mapToContactData(from array: [Any]) -> ContactData {
  let profileId = array[0] as? String
  let webCardId = array[1] as? String
  let firstName = array[2] as? String
  let lastName = array[3] as? String
  let company = array[4] as? String
  let title = array[5] as? String
  let phoneNumbers = array[6] as? [[String]]
  let emails = array[7] as? [[String]]
  let addresses = array[8] as? [[String]]
  let birthday = array[9] as? String

  var meetingLocation: LocationData?
  var meetingPlace: MeetingPlaceData?

  // If geolocation is present as the 11th element
  if array.count > 10, let geolocation = array[10] as? [String: Any] {
    if let locationDict = geolocation["location"] as? [String: Any] {
      // Accept both String and Double for latitude/longitude
      let latValue = locationDict["latitude"]
      let lonValue = locationDict["longitude"]
      let latitude: Double? = (latValue as? Double) ?? Double("\(latValue ?? "")")
      let longitude: Double? = (lonValue as? Double) ?? Double("\(lonValue ?? "")")
      if let latitude = latitude, let longitude = longitude {
        meetingLocation = LocationData(
          latitude: latitude,
          longitude: longitude
        )
      }
    }
    if let addressDict = geolocation["address"] as? [String: Any] {
      meetingPlace = MeetingPlaceData(
        city: addressDict["city"] as? String,
        country: addressDict["country"] as? String,
        region: addressDict["region"] as? String,
        subregion: addressDict["subregion"] as? String
      )
    }
  }

  return ContactData(
    profileId: profileId,
    webCardId: webCardId,
    firstName: firstName,
    lastName: lastName,
    company: company,
    title: title,
    emails: emails,
    phoneNumbers: phoneNumbers,
    addresses: addresses,
    birthday: birthday,
    meetingLocation: meetingLocation,
    meetingPlace: meetingPlace
  )
}

func verifySign(
  signature: String,
  data: String,
  salt: String,
  geolocation: [String: Any]?,
  completion: @escaping (Result<[String: Any], Error>) -> Void
) {
  guard let url = URL(string: "\(Constants.API_URL)verifySign") else {
    completion(
      .failure(NSError(domain: "", code: -2, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
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
          NSError(domain: "", code: -4, userInfo: [NSLocalizedDescriptionKey: "No data received"])))
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

struct ContentView_Previews: PreviewProvider {
  static var previews: some View {
    ContentView()
  }
}
