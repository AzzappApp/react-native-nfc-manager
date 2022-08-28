import UIKit
import Nuke


@objc (AZPMediaImageRendererManager)
class AZPMediaImageRendererManager: RCTViewManager {

  private static var cacheInitialized = false;

  private static func initCache() {
    ImagePipeline.shared = ImagePipeline(configuration: .withDataCache)
    cacheInitialized = true;
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  override func view() -> UIView! {
    if (!AZPMediaImageRendererManager.cacheInitialized) {
      AZPMediaImageRendererManager.initCache();
    }
    return AZPMediaImageRenderer(frame: CGRect())
  }
  
  @objc(addCacheEntry:size:uri:)
  func addCacheEntry(_ mediaID: NSString, size: NSNumber, uri: NSString) {
    MediaImageURICache.shared.addCacheEntry(mediaID: mediaID, size: size, uri: uri)
  }
  
}

struct AZPMediaImageRendererSource {
  var uri: URL;
  var mediaID: NSString;
  var requestedSize: NSNumber
  
  static func == (lhs: AZPMediaImageRendererSource, rhs: AZPMediaImageRendererSource) -> Bool {
    return lhs.uri == rhs.uri && lhs.mediaID == rhs.mediaID && lhs.requestedSize == rhs.requestedSize
  }
}

@objc(AZPMediaImageRenderer)
class AZPMediaImageRenderer: UIImageView {

  private var _imageTask: ImageTask?
  var _source: AZPMediaImageRendererSource?
  
  override init(frame: CGRect) {
    super.init(frame: frame)
  }
 
  required init?(coder: NSCoder) {
    super.init(coder: coder)
  }
  
  @objc
  var source: NSDictionary? {
    didSet {
      guard let json = source else {
        self._source = nil;
        self.reset()
        return;
      }
      guard
        let uriString = json.object(forKey: "uri") as? NSString,
        let uri =  URL(string: uriString as String),
        let mediaId = json.object(forKey: "mediaID") as? NSString,
        let requestedSize = json.object(forKey: "requestedSize") as? NSNumber
      else {
        NSLog("invalid source provided %@", json);
        self._source = nil;
        self.reset()
        return;
      }
      let newSource = AZPMediaImageRendererSource(
        uri: uri,
        mediaID: mediaId,
        requestedSize: requestedSize
      )
      if let source = _source {
        if (newSource == source) {
          return;
        }
      }
      _source = newSource;
      self.reset()
      self.loadSource()
    }
  }

  @objc
  var onLoad: RCTDirectEventBlock?
  @objc
  var onPlaceHolderImageLoad: RCTDirectEventBlock?
  @objc
  var onError: RCTDirectEventBlock?
  
  
  private func reset() {
    _imageTask?.cancel();
    self.image = nil;
  }


  private func loadSource() {
    guard let source = _source  else {
      self.image = nil;
      return;
    }
    
    let request = source.uri.asImageRequest()
    let pipeline = ImagePipeline.shared;
    
    if let imageContainer = pipeline.cache[request] {
      self.image = imageContainer.image;
      MediaImageURICache.shared.addCacheEntry(
        mediaID: source.mediaID,
        size: source.requestedSize,
        uri: NSString(string: source.uri.absoluteString)
      )
      self.onLoad?(nil)
      return
    }
    
    _imageTask = pipeline.loadImage(
      with: request,
      queue: .main,
      progress: nil,
      completion: { [weak self] result in
        switch(result) {
          case let .success(response):
            self?.image = response.image
            MediaImageURICache.shared.addCacheEntry(
              mediaID: source.mediaID,
              size: source.requestedSize,
              uri: NSString(string: source.uri.absoluteString)
            )
            self?.onLoad?(nil)
          case let .failure(error):
            self?.onError?(["error" : error.description ])
        }
      }
    )
    
    guard let (nsPlaceholderURI, placeholderSize) = MediaImageURICache.shared.queryCache(
            mediaID: source.mediaID,
            size: source.requestedSize
    ) else { return }
    
    let placeholderURI = nsPlaceholderURI as String
    
    if let imageContainer = pipeline.cache.cachedImage(for: placeholderURI) {
      self.image = imageContainer.image;
      self.onPlaceHolderImageLoad?(nil)
      return
    }
    
    if (placeholderURI.starts(with: "file://")) {
      let fileManager = FileManager.default;
      if (fileManager.fileExists(atPath: placeholderURI)) {
        self.image = UIImage(contentsOfFile: placeholderURI);
        self.onPlaceHolderImageLoad?(nil)
        return
      }
    }
    
    MediaImageURICache.shared.removeCacheEntry(mediaID: source.mediaID , size: placeholderSize)
  }
 
}


class MediaImageURICache {
  static var shared = MediaImageURICache()
  
  private let cache = NSCache<NSString, NSMutableDictionary>()
  
  init() {
    cache.countLimit = 100;
  }
  
  func queryCache(mediaID: NSString, size: NSNumber) -> (NSString, NSNumber)? {
    guard let mediaCache = cache.object(forKey: mediaID) else {
      return nil;
    }
    var uri: NSString? = nil;
    var currentUriSize: Float = 0
    let requestedSize: Float = Float(truncating: size)
    for (key, value) in mediaCache {
      guard let entrySize = key as? NSNumber, let entryUri = value as? NSString else {
        continue;
      }
      let compareSize = Float(truncating: entrySize)
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
  
  func addCacheEntry(mediaID: NSString, size: NSNumber, uri: NSString) {
    if (cache.object(forKey: mediaID) == nil) {
      cache.setObject(NSMutableDictionary(), forKey: mediaID)
    }
    guard let mediaCache = cache.object(forKey: mediaID) else {
      return;
    }
    
    mediaCache[size] = uri;
  }
  
  func removeCacheEntry(mediaID: NSString, size: NSNumber) {
    guard let mediaCache = cache.object(forKey: mediaID) else {
      return;
    }
    
    mediaCache.removeObject(forKey: size as NSNumber)
    if (mediaCache.count == 0) {
      cache.removeObject(forKey: mediaID)
    }
  }
}
