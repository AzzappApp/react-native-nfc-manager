//
//  ShareContactAppClipApp.swift
//  ShareContactAppClip
//
//  Created by seb on 02/08/2024.
//

import SwiftUI
import ContactsUI

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
    @State var step: String?

    var body: some View {
      VStack {
        Spacer()
        if let username = username {
            Text("Username: \(username)")
        } else {
            Text("Username: Not available")
        }
        Text(": \(step ?? "Not available")").padding()
      }
      .onContinueUserActivity(NSUserActivityTypeBrowsingWeb, perform: handleUserActivity)
    }

    private func handleUserActivity(_ userActivity: NSUserActivity) {
      guard let webpageURL = userActivity.webpageURL else {
          print("No webpage URL found in user activity")
          closeAppClip()
          return
      }
      self.step = "10 \(webpageURL)"

      // Check if the webpageURL starts with "https://appclip.apple.com"
      if webpageURL.absoluteString.hasPrefix("https://appclip.apple.com") {
          // Extract the "url" query parameter
          guard let urlComponents = URLComponents(url: webpageURL, resolvingAgainstBaseURL: false),
            let queryItems = urlComponents.queryItems,
            let compressedContactCard = queryItems.first(where: { $0.name == "c" })?.value,
            let username = queryItems.first(where: { $0.name == "u" })?.value else {
              closeAppClip()
              return
            }
          handleContactData(compressedContactCard: compressedContactCard, username: username)
      } else {
             closeAppClip()
      } 
    }


  
    private func handleContactData(compressedContactCard: String, username: String) {
      self.username = username
      guard let decodedURI = compressedContactCard.removingPercentEncoding else {
          print("Failed to decode URI component.")
          return
      }
      let decompressedContactCard = decompressFromEncodedURIComponent(input:decodedURI)
      guard let jsonData = decompressedContactCard.data(using: .utf8) else {
            print("Failed to convert cleaned string to data.")
            return
      }
     self.step = "1  \(decompressedContactCard)"
      do {
        // Parse the JSON array
        guard let jsonArray = try JSONSerialization.jsonObject(with: jsonData, options: []) as? [Any] else {
          print("Failed to parse JSON array.")
          self.step = "2"
          return
        }
        
        guard jsonArray.count == 2 else {
          print("Invalid JSON structure: Expected 2 elements, found \(jsonArray.count).")
             self.step = "3"
          return
        }
        
        guard let contactDataString = jsonArray[0] as? String else {
          print("Invalid JSON structure: First element is not a string.")
             self.step = "4"
          return
        }
        
        guard let signature = jsonArray[1] as? String else {
          print("Invalid JSON structure: Second element is not a string.")
             self.step = "5"
          return
        }
        self.step = "6"
        // Remove outer quotes and unescape characters
        let cleanedContactDataString = contactDataString
          .replacingOccurrences(of: "\r", with: "")
          .replacingOccurrences(of: "\n", with: "")
          .replacingOccurrences(of: "\"[", with: "[")
          .replacingOccurrences(of: "]\"", with: "]")
          .replacingOccurrences(of: "\"\"", with: "\"")
        
        self.step = "7  \(cleanedContactDataString)"
        
        verifySign(signature: signature, data: cleanedContactDataString, salt: username) { result in
         self.step = "7-bis  \(result)"
          switch result {
          case .success(let additionalContactData):

            guard let contactDataJSONData = cleanedContactDataString.data(using: .utf8) else {
              print("Failed to convert contact data string to data.")
               self.step = "8"
              return
            }
            do {
            // Parse the cleaned JSON string (or does notcompile if not using a do block
              guard let contactDataArray = try JSONSerialization.jsonObject(with: contactDataJSONData, options: []) as? [Any] else {
                print("Failed to parse contact data JSON array.")
                   self.step = "9"
                return
              }
              
              // Map the JSON array to ContactData
              var contactData = mapToContactData(from: contactDataArray)
                 self.step = "10"
              if let avatarUrl = additionalContactData["avatarUrl"] as? String {
                contactData.avatarUrl = avatarUrl
              }
              
              if let socialsArray = additionalContactData["socials"] as? [[String: Any]] {
                  var socials: [Social] = []
                  for socialDict in socialsArray {
                      if let label = socialDict["label"] as? String,
                        let url = socialDict["url"] as? String{
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
              DispatchQueue.main.async {
                   self.step = "13"
                addContact(contactData, username: username)
                }
            } catch {
                 self.step = "14  \(error)"
              print("Error parsing contact data JSON: \(error)")
          }
          case .failure(let error):
           self.step = "15 \(error.localizedDescription)"
            print("Error verifying sign-in: \(error.localizedDescription)")
          }
        }
      } catch {
        self.step = "16 \(error)"
        print("Failed to decode contact data: \(error)")
      }
      self.step = "Ended without verify sign"
    }



  private func addContact(_ contactData: ContactData, username :String) {
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
        let dateFormatter = DateFormatter()
        dateFormatter.timeZone = TimeZone(secondsFromGMT: 0)
       if let date = dateFormatter.date(from: birthday) {
         let calendar = Calendar.current
         let components = calendar.dateComponents([.year, .month, .day], from: date)
         contact.birthday = components
       }
    }

     if let socials = contactData.socials {
        contact.socialProfiles = socials.map { social in
            CNLabeledValue(label: social.label, value: CNSocialProfile(urlString: social.url, username: social.url, userIdentifier: nil, service: social.label))
        }
    }
    var urlAddresses = [CNLabeledValue<NSString>]()
    if let urls = contactData.urls {
        urlAddresses = urls.map { urlData in
            CNLabeledValue(label: urlData.label, value: urlData.url as NSString)
        }
    }
    guard let baseUrl = ProcessInfo.processInfo.environment["BASE_URL"] else {
      print("Base url not defined")
      return
    }

    urlAddresses.append(CNLabeledValue(label: "Azzapp", value:  "\(baseUrl)\(username)" as NSString))

    contact.urlAddresses = urlAddresses

    // Add note with link
    contact.note = "Made with Azzapp" 	
    
    if let avatarUrl = contactData.avatarUrl, let url = URL(string: avatarUrl) {
    URLSession.shared.dataTask(with: url) { data, response, error in
        if let data = data {
            contact.imageData = data
        }
        
        DispatchQueue.main.async {
             ContactViewControllerDelegateHandler.shared.presentContactViewController(with: contact)
        }
    }.resume()
    } else {
         ContactViewControllerDelegateHandler.shared.presentContactViewController(with: contact)
    }
  }
}


class ContactViewControllerDelegateHandler: NSObject, CNContactViewControllerDelegate {
  static let shared = ContactViewControllerDelegateHandler()

  func presentContactViewController(with contact: CNMutableContact) {
      let contactViewController = CNContactViewController(forNewContact: contact)
      contactViewController.delegate = self

      let viewController = UIApplication.shared.windows.first?.rootViewController
      viewController?.present(UINavigationController(rootViewController: contactViewController), animated: true)
  }

  func contactViewController(_ viewController: CNContactViewController, didCompleteWith contact: CNContact?) {
    if let contact = contact {
        // Handle the "Done" button click
        print("Contact saved: \(contact)")
    } else {
        // Handle the "Cancel" button click
        print("Contact creation canceled")
    }
    viewController.dismiss(animated: true) {
        UIApplication.shared.perform(#selector(NSXPCConnection.suspend))
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
}

struct Social: Codable {
    var label: String
    var url: String
}

struct URLData: Codable  {
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
      birthday: birthday
    )
}

func verifySign(signature: String, data: String, salt: String, completion: @escaping (Result<[String: Any], Error>) -> Void) {
    guard let baseUrl = ProcessInfo.processInfo.environment["BASE_URL"] else {
      completion(.failure(NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Base url not defined"])))
      return
    }

    guard let url = URL(string: "\(baseUrl)api/verifySign") else {
      completion(.failure(NSError(domain: "", code: -2, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
      return
    }

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("application/json", forHTTPHeaderField: "Accept")
        
    let json: [String: String] = ["signature": signature, "data": data, "salt": salt]
    do {
      let jsonData = try JSONSerialization.data(withJSONObject: json, options: [])
      request.httpBody = jsonData
    } catch {
      print("Failed to serialize JSON: \(error.localizedDescription)")
      completion(.failure(NSError(domain: "", code: -31, userInfo: [NSLocalizedDescriptionKey: "Failed to parse JSON request"])))
      return
    }
   
    URLSession.shared.dataTask(with: request) { data, response, error in
      if let error = error {
          completion(.failure(error))
          return
      }

      guard let data = data else {
        completion(.failure(NSError(domain: "", code: -4, userInfo: [NSLocalizedDescriptionKey: "No data received"])))
        return
      }

      do {
        if let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] {
            completion(.success(json))
        } else {
            print("Failed to parse JSON response")
            completion(.failure(NSError(domain: "", code: -5, userInfo: [NSLocalizedDescriptionKey: "Failed to parse JSON response"])))
        }
      } catch {
          print("Failed to parse JSON: \(error.localizedDescription)")
          completion(.failure(error))
      }
    }.resume()
}



private func closeAppClip() {
 UIApplication.shared.perform(#selector(NSXPCConnection.suspend))
}


