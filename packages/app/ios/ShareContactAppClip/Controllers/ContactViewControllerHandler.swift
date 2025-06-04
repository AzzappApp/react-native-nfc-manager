import ContactsUI
import SwiftUI

class ContactViewControllerDelegateHandler: NSObject, CNContactViewControllerDelegate {
  static let shared = ContactViewControllerDelegateHandler()

  var username: String?
  var showShareBackScreen: Binding<Bool>?
  var contactData: ContactData?

  private func presentContactViewController(with contact: CNMutableContact) {
    let contactViewController = CNContactViewController(forNewContact: contact)
    contactViewController.delegate = self

    let viewController = UIApplication.shared.windows.first?.rootViewController
    viewController?.present(
      UINavigationController(rootViewController: contactViewController),
      animated: true
    )
  }

  func contactViewController(
    _ viewController: CNContactViewController,
    didCompleteWith contact: CNContact?
  ) {
    viewController.dismiss(animated: true) {
      // Always show ShareBackScreen, regardless of whether contact was saved
      self.showShareBackScreen?.wrappedValue = true
    }
  }

  func addContact(_ contactData: ContactData, username: String, showShareBackScreen: Binding<Bool>)
  {
    self.username = username
    self.showShareBackScreen = showShareBackScreen
    self.contactData = contactData  // Store the contact data

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
            urlString: social.url,
            username: social.url,
            userIdentifier: nil,
            service: social.label
          )
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
          self.presentContactViewController(with: contact)
        }
      }.resume()
    } else {
      presentContactViewController(with: contact)
    }
  }
}
