import SwiftUI

struct PhoneInputField: View {
  var title: String
  var placeHolder: String
  @Binding var phone: String
  @Binding var selectedCountry: Country
  @State private var internalPhone: String = ""
  @FocusState private var isFocused: Bool

  var body: some View {
    VStack(spacing: 0) {
      // Top border
      Rectangle()
        .fill(Color(hex: "#F5F5F6"))
        .frame(height: 1)

      HStack(spacing: 10) {
        Text(title)
          .font(.system(size: 12, weight: .medium))
          .frame(width: 70, alignment: .leading)

        // Country picker - Simplified version
        Menu {
          ForEach(countries) { country in
            Button(action: {
              selectedCountry = country
              syncPhoneValue()
            }) {
              // Simplified structure with less nesting
              HStack(spacing: 8) {
                Text("\(country.flag) \(country.name) \(country.code)")
              }
              .contentShape(Rectangle())
            }
          }
        } label: {
          HStack(spacing: 2) {
            Text(selectedCountry.flag)
              .font(.system(size: 16))
            Image(systemName: "chevron.down")
              .font(.system(size: 10))
              .foregroundColor(.black)
          }
          .padding(.vertical, 8)
          .padding(.horizontal, 4)
          .background(Color(hex: "#F5F5F6"))
          .cornerRadius(6)
        }

        ZStack(alignment: .leading) {
          if internalPhone.isEmpty {
            Text(placeHolder)
              .foregroundColor(Color(hex: "#C8C7CA"))
              .font(.system(size: 16, weight: .medium))
              .lineSpacing(18)
          }

          TextField("", text: $internalPhone)
            .font(.system(size: 16, weight: .medium))
            .lineSpacing(18)
            .foregroundColor(.black)
            .padding(.vertical, 12)
            .keyboardType(.phonePad)
            .focused($isFocused)
            .onChange(of: internalPhone) { newValue in
              let filtered = newValue.filter { $0.isNumber || $0.isWhitespace || $0 == "+" }
              if filtered != newValue {
                internalPhone = filtered
              }
              detectCountryFromInput(filtered)
              updateParentValue()
            }
        }
      }
      .padding(.horizontal, 20)
    }
    .frame(height: 50)
    .frame(maxWidth: .infinity)
    .onAppear {
      if phone.isEmpty {
        // Get the current region code from the device
        if let regionCode = Locale.current.region?.identifier {
          // Try to find a matching country by region code
          if let country = countries.first(where: { $0.regionCode == regionCode }) {
            selectedCountry = country
          }
        }
        // Always start with the + prefix
        internalPhone = selectedCountry.code
      } else {
        // Ensure the phone number has a + prefix
        internalPhone = phone.hasPrefix("+") ? phone : "+" + phone
        detectCountryFromInput(internalPhone)
      }
    }
  }

  // Update when selectedCountry changes
  private func syncPhoneValue() {
    // If the phone is empty or only has a code, replace with new code
    if internalPhone.isEmpty || internalPhone.hasPrefix("+") && !internalPhone.contains(" ") {
      internalPhone = selectedCountry.code
    } else if let range = internalPhone.range(of: "\\+[0-9]+", options: .regularExpression) {
      // Replace just the code portion
      internalPhone = internalPhone.replacingCharacters(in: range, with: selectedCountry.code)
    } else {
      // Prepend the code if there isn't one
      internalPhone = selectedCountry.code + " " + internalPhone
    }
    updateParentValue()
  }

  // Check if input contains a recognizable country code
  private func detectCountryFromInput(_ input: String) {
    // Only proceed if input starts with +
    guard input.hasPrefix("+") else { return }

    // Find the longest matching country code
    for country in countries.sorted(by: { $0.code.count > $1.code.count }) {
      if input.hasPrefix(country.code) {
        if country.code != selectedCountry.code {
          selectedCountry = country
        }
        return
      }
    }
  }

  // Keep the parent value in sync
  private func updateParentValue() {
    // Ensure the phone number always has a + prefix
    phone = internalPhone.hasPrefix("+") ? internalPhone : "+" + internalPhone
  }
}
