package com.azzapp.media

import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import android.net.Uri
import androidx.media3.common.util.UnstableApi
import com.facebook.react.bridge.*


@UnstableApi class MediaHelpers(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "AZPMediaHelpers"

  @ReactMethod
  fun getVideoSize(uri: String, promise: Promise) {
    val width: Int
    val height: Int
    val uri = try { Uri.parse(uri) } catch (e: NullPointerException) { null }
    if (uri == null) {
      promise.reject("INVALID_URI", "provided uri is invalid");
      return
    }
    try {
      val metaRetriever = MediaMetadataRetriever()
      metaRetriever.setDataSource(uri.path)
      val frame: Bitmap? = metaRetriever.frameAtTime
      if (frame == null) {
        promise.reject("failure", "Could not find video", null)
        return
      }
      width = frame.width
      height = frame.height
    } catch (e: Error) {
      promise.reject("failure", "Error while retrieving metadata", e)
      return;
    }
    val map = WritableNativeMap();
    map.putInt("width", width);
    map.putInt("height", height);
    promise.resolve(map)
  }

  @ReactMethod
  fun prefetchVideo(uriStr: String, promise: Promise) {
    val uri = try { Uri.parse(uriStr) } catch(e: NullPointerException) {
      promise.reject("INVALID_URI", "provided uri is invalid")
      return;
    }
    VideoCache.prefetch(uri, promise)
  }

  @ReactMethod
  fun observeVideoPrefetchResult(uriStr: String, promise: Promise) {
    val uri = try { Uri.parse(uriStr) } catch(e: NullPointerException) {
      promise.reject("INVALID_URI", "provided uri is invalid")
      return;
    }
    VideoCache.observePrefetchResult(uri, promise)
  }

  @ReactMethod
  fun cancelVideoPrefetch(uriStr: String) {
    val uri = try { Uri.parse(uriStr) } catch(e: NullPointerException) { return }
    VideoCache.cancelPrefetch(uri)
  }
}