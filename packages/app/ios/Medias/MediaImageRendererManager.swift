import Nuke


@objc (AZPMediaImageRendererManager)
class MediaImageRendererManager: RCTViewManager {
  override var methodQueue: DispatchQueue! {
    return DispatchQueue.main
  }
  
  @objc override static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  override func view() -> UIView! {
    return MediaImageRenderer()
  }
}

struct MediaImageRendererSource {
  var uri: URL;
  var mediaId: NSString;
  var requestedSize: NSNumber
  
  static func == (lhs: MediaImageRendererSource, rhs: MediaImageRendererSource) -> Bool {
    return lhs.uri == rhs.uri && lhs.mediaId == rhs.mediaId && lhs.requestedSize == rhs.requestedSize
  }
}

@objc(AZPMediaImageRenderer)
class MediaImageRenderer: UIImageView {

  private var _imageTask: ImageTask?
  var _source: MediaImageRendererSource?
   
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
        let mediaId = json.object(forKey: "mediaId") as? NSString,
        let requestedSize = json.object(forKey: "requestedSize") as? NSNumber
      else {
        NSLog("invalid source provided %@", json);
        self._source = nil;
        self.reset()
        return;
      }
      let newSource = MediaImageRendererSource(
        uri: uri,
        mediaId: mediaId,
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
  
  @objc
  var imageColor: UIColor?{
    didSet{
      loadSource()
    }
  }
  
  deinit {
    reset()
  }
  
  private func reset() {
    _imageTask?.cancel();
    self.image = nil;
  }

  private func loadSource() {
    guard let source = _source  else {
      self.image = nil;
      return;
    }
    
    let request = ImageRequest(url: source.uri)
    let pipeline = MediaPipeline.pipeline;
    
    if let imageContainer = pipeline.cache.cachedImage(for: request) {
      if let tintColor = self.imageColor {
        self.image = imageContainer.image.withTintColor(tintColor)
      } else {
        self.image = imageContainer.image
      }
      MediaURICache.imageCache.addCacheEntry(
        mediaId: source.mediaId,
        size: source.requestedSize,
        uri: source.uri
      )
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.001) {
        self.onLoad?(nil)
      }
      return
    }
    
    
    _imageTask = pipeline.loadImage(
      with: request,
      queue: .main,
      progress: nil,
      completion: { [weak self] result in
        switch(result) {
          case let .success(response):
            if let tintColor = self?.imageColor {
              self?.image = response.image.withTintColor(tintColor)
            } else {
              self?.image = response.image
            }
            MediaURICache.imageCache.addCacheEntry(
              mediaId: source.mediaId,
              size: source.requestedSize,
              uri: source.uri
            )
            self?.onLoad?(nil)
          case let .failure(error):
            self?.onError?(["error" : error.description ])
        }
      }
    )
    
    while true {
      // we find the most approriate size in cache
      guard let (placeholderURI, placeholderSize) = MediaURICache.imageCache.queryCache(
              mediaId: source.mediaId,
              size: source.requestedSize
      ) else { return }
      
      // we use this image as placeholder if the file is an image
      if let imageContainer = pipeline.cache.cachedImage(for: ImageRequest(url: placeholderURI)) {
        self.image = imageContainer.image;
        self.onPlaceHolderImageLoad?(nil)
        return
      }
      
      // we use this image as placeholder if the file is a local file
      if (placeholderURI.scheme == "file") {
        if (FileManager.default.fileExists(atPath: placeholderURI.path)) {
          self.image = UIImage(contentsOfFile: placeholderURI.path);
          self.onPlaceHolderImageLoad?(nil)
          return
        }
      }
      
      // either the file is not in image cache anymore, or the local file has been deleted
      // we remove it from cache
      MediaURICache.imageCache.removeCacheEntry(mediaId: source.mediaId , size: placeholderSize)
    }
  }
}
