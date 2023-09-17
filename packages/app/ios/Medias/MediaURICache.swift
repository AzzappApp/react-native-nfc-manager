//
//  MediaURICache.swift
//  azzapp
//
//  Created by François de Campredon on 08/05/2023.
//

import Foundation

class MediaURICache {
  static var imageCache = MediaURICache()
  
  static var videoCache = MediaURICache()
  
  private let cache = NSCache<NSString, NSMutableDictionary>()
  
  private init() {
    cache.countLimit = 1000;
  }
  
  func queryCache(mediaId: NSString, size: NSNumber) -> (URL, NSNumber)? {
    guard let mediaCache = cache.object(forKey: mediaId) else {
      return nil;
    }
    var uri: URL? = nil;
    var currentUriSize: Double = 0
    let requestedSize: Double = Double(truncating: size)
    for (key, value) in mediaCache {
      guard let entrySize = key as? NSNumber, let entryUri = value as? URL else {
        continue;
      }
      let compareSize = Double(truncating: entrySize)
      // local file always take precedence
      if (compareSize == -1) {
        if !FileManager.default.fileExists(atPath: entryUri.path) {
          mediaCache.removeObject(forKey: key)
          continue
        } else {
          return (entryUri, entrySize)
        }
      }
      if (abs(compareSize - requestedSize) < abs(currentUriSize - requestedSize)) {
        uri = entryUri
        currentUriSize = compareSize
      }
    }
    guard let uri = uri else {
      return nil;
    }
    return (uri, NSNumber(value: currentUriSize));
  };
  
  
  func getLocaleURI(for mediaId: NSString) -> URL? {
    guard let mediaCache = cache.object(forKey: mediaId) else {
      return nil;
    }
    for (key, value) in mediaCache {
      guard let entrySize = key as? NSNumber, let entryUri = value as? URL else {
        continue;
      }
      let compareSize = Double(truncating: entrySize)
      // local file always take precedence
      if (compareSize == -1) {
        if !FileManager.default.fileExists(atPath: entryUri.path) {
          mediaCache.removeObject(forKey: key)
        } else {
          return entryUri
        }
      }
    }
    return nil
  };
  
  func addCacheEntry(mediaId: NSString, size: NSNumber, uri: URL) {
    if (cache.object(forKey: mediaId) == nil) {
      cache.setObject(NSMutableDictionary(), forKey: mediaId)
    }
    guard let mediaCache = cache.object(forKey: mediaId) else {
      return;
    }
    
    mediaCache[size] = uri;
  }
  
  func addLocaleFileCacheEntry(mediaId: NSString, uri: URL) {
    addCacheEntry(mediaId: mediaId, size: -1, uri: uri)
  }
  
  func removeCacheEntry(mediaId: NSString, size: NSNumber) {
    guard let mediaCache = cache.object(forKey: mediaId) else {
      return;
    }
    
    mediaCache.removeObject(forKey: size as NSNumber)
    if (mediaCache.count == 0) {
      cache.removeObject(forKey: mediaId)
    }
  }
}
