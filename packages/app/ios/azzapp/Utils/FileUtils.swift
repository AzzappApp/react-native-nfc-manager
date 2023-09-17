//
//  FileUtils.swift
//  azzapp
//
//  Created by François de Campredon on 18/04/2023.
//

import Foundation


class FileUtils {
  
  static func getRanfomFileURL(withExtension ext: String) -> URL {
    return NSURL
      .fileURL(withPathComponents: [NSTemporaryDirectory(), UUID().uuidString])!
      .appendingPathExtension(ext)
  }

}
