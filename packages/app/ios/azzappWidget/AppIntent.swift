//
//  AppIntent.swift
//  Appintent
//
//  Created by Sebastien on 16/12/2024.
//

import WidgetKit
import AppIntents
import SwiftUI

struct ConfigurationAppIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource { "Configuration" }

    @Parameter(title: LocalizedStringResource("webcard"), optionsProvider: UserNameOptionsProvider())
    var selectedUserName: String?

    @Parameter(title: LocalizedStringResource("theme"), default: .dark)
    var theme: Theme
  

}

struct UserNameOptionsProvider: DynamicOptionsProvider {
  func results() async throws -> [String] {
    return Provider.storedData.map { $0.userName }
  }
}

enum Theme: String, AppEnum {
    case dark
    case white
    case primary

    static var typeDisplayRepresentation: TypeDisplayRepresentation {
      "theme"
    }
    
    static var caseDisplayRepresentations: [Theme: DisplayRepresentation] {
        [
            .dark: DisplayRepresentation(title: LocalizedStringResource("dark")),
            .white: DisplayRepresentation(title: LocalizedStringResource("white")),
            .primary: DisplayRepresentation(title: LocalizedStringResource("color"))
        ]
    }
}
