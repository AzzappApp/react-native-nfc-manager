import CommonCrypto
import SwiftUI


struct ShareBackScreen: View {
  @State var firstName: String = ""
  @State var lastName: String = ""
  @State var phone: String = ""
  @State var email: String = ""
  @State var company: String = ""
  @State var title: String = ""
  @State var isSubmitting: Bool = false
  @State private var showErrorAlert = false
  @State private var showWelcomeMessage = true
  @State private var showPhoneNumberMenu = false
  @Binding var isPresented: Bool
  @FocusState private var focusedField: Field?
  @State private var selectedCountry: Country = countries.first!
  var username: String
  var avatarUrl: String?
  var contactData: ContactData?

  enum Field {
    case firstName, lastName, phone, email, company, title
  }

  private var isFormValid: Bool {
    // Check if phone has more than just the country code
    let phoneWithoutSpaces = phone.replacingOccurrences(of: " ", with: "")
    let hasValidPhone =
      !phoneWithoutSpaces.isEmpty && phoneWithoutSpaces.count > selectedCountry.code.count

    return !firstName.isEmpty || !lastName.isEmpty || hasValidPhone || !email.isEmpty
      || !company.isEmpty || !title.isEmpty
  }

  private func localizedString(_ key: String) -> String {
    return NSLocalizedString(key, comment: "")
  }

  private func openWhatsApp(phoneNumber: String) {
    let whatsappURL = URL(string: "https://wa.me/\(phoneNumber)")!
    UIApplication.shared.open(whatsappURL)
  }

  private func openAppStore() {
    let appStoreURL = URL(string: "https://apps.apple.com/app/6502694267")!
    UIApplication.shared.open(appStoreURL)
  }

  var body: some View {
    ZStack {
      Color.black.opacity(0.5)
        .edgesIgnoringSafeArea(.all)
        .transition(.opacity)
      HStack(spacing: 15) {
        BorderCircle(avatarUrl: nil)
        BorderCircle(avatarUrl: avatarUrl)
      }
      .position(x: UIScreen.main.bounds.width / 2, y: 50)
      .zIndex(1)
      .onAppear {
        focusedField = .firstName
      }
      VStack(spacing: 0) {
        ScrollView {
          VStack(alignment: .leading, spacing: 0) {
            ZStack {
              // Centered title and username
              VStack(alignment: .center, spacing: 0) {
                Text(localizedString("Share your details with"))
                  .font(.system(size: 16, weight: .regular))
                  .foregroundColor(Color(white: 0.2))
                Text(username)
                  .font(.system(size: 16, weight: .bold))
                  .foregroundColor(.black)
              }
              // X button on the left
              HStack {
                Button(action: {
                  withAnimation(.easeOut(duration: 0.3)) {
                    isPresented = false
                  }
                }) {
                  Image(systemName: "xmark")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.black)
                    .padding(.leading, 16)
                }
                Spacer()
              }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .padding(.top, 20)
            .padding(.bottom, 20)

            // Form fields
            VStack {
              InputField(
                title: localizedString("First name"),
                placeHolder: localizedString("Enter your first name"),
                keyboardType: .default,
                text: $firstName
              )
              .focused($focusedField, equals: .firstName)
              InputField(
                title: localizedString("Last name"),
                placeHolder: localizedString("Enter your last name"),
                keyboardType: .default,
                text: $lastName
              )
              .focused($focusedField, equals: .lastName)
              PhoneInputField(
                title: localizedString("Phone"),
                placeHolder: localizedString("Enter your number"),
                phone: $phone,
                selectedCountry: $selectedCountry
              )
              .focused($focusedField, equals: .phone)
              InputField(
                title: localizedString("Email"),
                placeHolder: localizedString("Enter your email address"),
                keyboardType: .emailAddress,
                text: $email
              )
              .focused($focusedField, equals: .email)
              InputField(
                title: localizedString("Company"),
                placeHolder: localizedString("Enter your company name"),
                keyboardType: .default,
                text: $company
              )
              .focused($focusedField, equals: .company)
              InputField(
                title: localizedString("Title"),
                placeHolder: localizedString("Enter your title"),
                keyboardType: .default,
                text: $title
              )
              .focused($focusedField, equals: .title)
            }
          }
          .padding(.top, 20)
        }

        Button(action: {
          submitDetails()
        }) {
          if isSubmitting {
            ProgressView()
              .progressViewStyle(CircularProgressViewStyle(tint: .white))
              .frame(maxWidth: .infinity)
              .frame(height: 47)
          } else {
            Text(localizedString("Send"))
              .font(.system(size: 18, weight: .semibold))
              .foregroundColor(.white)
              .frame(maxWidth: .infinity)
              .frame(height: 47)
          }
        }
        .background(isFormValid ? Color(hex: "2C2B32") : Color.gray)
        .cornerRadius(23.5)
        .overlay(
          RoundedRectangle(cornerRadius: 23.5)
            .stroke(isFormValid ? Color.black : Color.gray, lineWidth: 2)
        )
        .disabled(!isFormValid || isSubmitting)
        .padding(.horizontal, 20)
        .padding(.bottom, 20)
      }
      .background(Color.white)
      .cornerRadius(24)
      .padding(.horizontal, 20)
      .padding(.top, 50)
      .padding(.bottom, 20)
      .onTapGesture {
        hideKeyboard()
      }
      .transition(.opacity)
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
    .onAppear {
      focusedField = .firstName
      // Ask for location only if not present in contactData
      if contactData?.meetingLocation == nil {
        showWelcomeMessage = true
      } else {
        showWelcomeMessage = false
      }
    }
    .alert(localizedString("Error"), isPresented: $showErrorAlert) {
      Button(localizedString("OK"), role: .cancel) {}
    } message: {
      Text(localizedString("Oops, something went wrong, please retry."))
    }
  }

  private func validateForm() -> Bool {
    if !isFormValid {
      showErrorAlert = true
      return false
    }
    return true
  }

  private func submitDetails() {
    guard validateForm() else { return }
    isSubmitting = true
    continueWithSubmission()
  }

  private func continueWithSubmission() {
    // Generate timestamp and token
    let timestamp = Int(Date().timeIntervalSince1970)

    // Construct the API URL
    guard let url = URL(string: "\(Constants.API_URL)/shareback") else {
      showErrorAlert = true
      isSubmitting = false
      return
    }

    // Format phone numbers array
    let phoneNumbers: [[String: Any]] = [["label": "Home", "number": phone]]

    // Format emails array
    let emails: [[String: Any]] = [["label": "Main", "address": email]]

    // Prepare the contact data
    var contactDataPayload: [String: Any] = [
      "firstName": firstName,
      "lastName": lastName,
      "phoneNumbers": phoneNumbers,
      "emails": emails,
      "company": company,
      "title": title,
      "addresses": [],
      "socials": [],
      "urls": [],
    ]

    // Add additional contact data if available
    if let contact = contactData {
      if let webCardId = contact.webCardId {
        contactDataPayload["webCardId"] = webCardId
      }
      // Add meetingLocation and meetingPlace only if both are present
      if let meetingLocation = contact.meetingLocation,
        let meetingPlace = contact.meetingPlace
      {
        contactDataPayload["meetingLocation"] = [
          "latitude": meetingLocation.latitude,
          "longitude": meetingLocation.longitude,
        ]
        var placeDict: [String: Any] = [:]
        if let city = meetingPlace.city { placeDict["city"] = city }
        if let country = meetingPlace.country { placeDict["country"] = country }
        if let region = meetingPlace.region { placeDict["region"] = region }
        if let subregion = meetingPlace.subregion { placeDict["subregion"] = subregion }
        contactDataPayload["meetingPlace"] = placeDict
      }
    }

    // Prepare the final payload
    let payload: [String: Any] = [
      "username": username,
      "timestamp": timestamp,
      "contactData": contactDataPayload,
      "token": contactData?.token ?? "",
      "profileId": contactData?.profileId ?? "",
    ]

    // Create and configure the request
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")

    do {
      request.httpBody = try JSONSerialization.data(withJSONObject: payload)
    } catch {
      showErrorAlert = true
      isSubmitting = false
      return
    }

    // Make the API call
    URLSession.shared.dataTask(with: request) { data, response, error in
      DispatchQueue.main.async {
        isSubmitting = false

        if let error = error {
          showErrorAlert = true
          return
        }

        if let httpResponse = response as? HTTPURLResponse {
          if httpResponse.statusCode == 200 {
            withAnimation(.easeOut(duration: 0.3)) {
              isPresented = false
            }
          } else {
            showErrorAlert = true
          }
        }
      }
    }.resume()
  }
}

extension View {
  func hideKeyboard() {
    UIApplication.shared.sendAction(
      #selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
  }
}

struct InputField: View {
  var title: String
  var placeHolder: String
  var keyboardType: UIKeyboardType
  @Binding var text: String

  var body: some View {
    VStack(spacing: 0) {
      // Top border
      Rectangle()
        .fill(Color(hex: "#F5F5F6"))
        .frame(height: 1)
      HStack(spacing: 10) {

        Text(title)
          .font(.system(size: 12, weight: .medium))
          .frame(width: 70, alignment: .leading)  // Set width as a percentage

        ZStack(alignment: .leading) {
          if text.isEmpty {
            Text(placeHolder)
              .foregroundColor(Color(hex: "#C8C7CA"))
              .font(.system(size: 16, weight: .medium))
              .lineSpacing(18)
          }

          TextField("", text: $text)
            .font(.system(size: 16, weight: .medium))
            .lineSpacing(18)
            .foregroundColor(.black)
            .padding(.vertical, 12)
            .keyboardType(keyboardType)

        }

      }
      .padding(.horizontal, 20)
    }.frame(height: 50).frame(maxWidth: .infinity)

  }
}

// Helper extension for hex colors
extension Color {
  init(hex: String) {
    let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
    var int: UInt64 = 0
    Scanner(string: hex).scanHexInt64(&int)
    let a: UInt64
    let r: UInt64
    let g: UInt64
    let b: UInt64
    switch hex.count {
    case 3:  // RGB (12-bit)
      (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
    case 6:  // RGB (24-bit)
      (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
    case 8:  // ARGB (32-bit)
      (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
    default:
      (a, r, g, b) = (255, 0, 0, 0)
    }
    self.init(
      .sRGB,
      red: Double(r) / 255,
      green: Double(g) / 255,
      blue: Double(b) / 255,
      opacity: Double(a) / 255
    )
  }
}

struct BorderCircle: View {
  let avatarUrl: String?

  var body: some View {
    ZStack {
      // Outer circle (38px)
      Circle()
        .fill(Color.white)
        .frame(width: 38, height: 38)

      // Middle circle (36px) with 2px border
      Circle()
        .stroke(Color.black, lineWidth: 2)
        .frame(width: 36, height: 36)

      // Inner circle (34px) with gray background and 2px border
      Circle()
        .fill(Color(hex: "F5F5F6"))
        .frame(width: 34, height: 34)

      // Image in the center (scaled to fit)
      if let urlString = avatarUrl, let url = URL(string: urlString) {
        AsyncImage(url: url) { phase in
          switch phase {
          case .empty:
            ProgressView()
          case .success(let image):
            image
              .resizable()
              .scaledToFill()
              .frame(width: 34, height: 34)
              .clipShape(Circle())
          case .failure:
            Image("Frame")
              .resizable()
              .scaledToFit()
              .frame(width: 16, height: 16)
              .foregroundColor(.white)
          @unknown default:
            EmptyView()
          }
        }
      } else {
        Image("Frame")
          .resizable()
          .scaledToFit()
          .frame(width: 16, height: 16)
          .foregroundColor(.white)
      }
    }
  }
}
