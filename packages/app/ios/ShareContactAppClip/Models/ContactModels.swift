import Foundation

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
  var avatarId: String?
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

struct Birthday {
  let month: Int
  let day: Int
  let year: Int?

  init(from dict: [String: Any]) {
    self.month = dict["month"] as? Int ?? 1
    self.day = dict["day"] as? Int ?? 1
    self.year = dict["year"] as? Int
  }
}

func mapToContactData(from array: [Any]) -> ContactData {
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
