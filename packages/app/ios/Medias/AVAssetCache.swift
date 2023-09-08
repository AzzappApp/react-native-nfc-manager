//
//  AssetPersistenceManager.swift
//  azzapp
//
//  Created by François de Campredon on 07/05/2023.
//

import Foundation
import AVFoundation



class AVAssetCache: NSObject {
  static let shared = AVAssetCache()
  
  private typealias TaskObserver = (onComplete:() -> Void, onError: (Error) -> Void)
  
  private typealias DownloadTask = Task<Void, Error>
  
  private var activeTasks = [URL: DownloadTask]()
  
  private var assetCache = NSCache<NSURL, AVURLAsset>()

  private var tasksObservers = [URL:[TaskObserver]]()
  
  private let assetKeys = ["playable", "tracks", "duration"]
  
  private var cacheDispatchQueue = DispatchQueue(label: "com.azzapp.azzapp.AVAssetCache")
  
  override private init() {
    super.init()
    assetCache.countLimit = 10;
  }
  
  func avAsset(for url: URL) -> AVURLAsset? {
    if url.isFileURL {
      return AVURLAsset(url: url)
    }
    return cacheDispatchQueue.sync {
      if let asset = assetCache.object(forKey: url as NSURL) {
        return asset
      }
      return nil
    }
  }
  
  func prefetchAsset(for url: URL) throws -> Bool  {
    if url.isFileURL {
      return false
    }
    
    return cacheDispatchQueue.sync {
      if activeTasks[url] != nil {
        return true
      }
      if assetCache.object(forKey: url as NSURL) != nil  {
        return false
      }
      
      let asset = AVURLAsset(url: url)
      let task = Task<Void, Error> {
        await asset.loadValues(forKeys: assetKeys)
        
        if Task.isCancelled {
          handleTaskDidFinish(url: url, error: CancellationError());
          return;
        }
        
        var error: NSError?
        for key in assetKeys {
          if asset.statusOfValue(forKey: key, error: &error) == .failed {
            handleTaskDidFinish(url: url, error: error)
            return
          }
        }
        handleTaskDidFinish(url: url, error: nil);
      }
    
      activeTasks[url] = task
      assetCache.setObject(asset, forKey: url as NSURL)
    
      return true
    }
  }
  
  func observePrefetch(for url: URL, onComplete: @escaping () -> Void, onError:  @escaping (Error) -> Void) throws {
    try cacheDispatchQueue.sync {
      guard activeTasks[url] != nil else {
        throw AVAssetCacheError.taskDoesNotExist
      }
      var taskObservers = tasksObservers[url] ?? [TaskObserver]()

      taskObservers.append((onComplete, onError))
      tasksObservers[url] = taskObservers
    }
  }
  
  func cancelPrefetch(for url: URL) throws {
    try cacheDispatchQueue.sync {
      guard let task = activeTasks[url] else {
        throw AVAssetCacheError.taskDoesNotExist
      }
      task.cancel()
      tasksObservers.removeValue(forKey: url)
      activeTasks.removeValue(forKey: url)
      assetCache.removeObject(forKey: url as NSURL)
    }
  }
  
  func handleTaskDidFinish(url: URL, error: Error?) {
    cacheDispatchQueue.sync {
      activeTasks.removeValue(forKey: url)
      
      if let observers = tasksObservers[url] {
        for (onComplete, onError) in observers {
          if let error = error {
            onError(error)
          } else  {
            onComplete()
          }
        }
      }
      tasksObservers.removeValue(forKey: url)
    }
  }
}

enum AVAssetCacheError: Error {
  case taskDoesNotExist
}

