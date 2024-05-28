package com.azzapp.media

import android.media.MediaMetadataRetriever
import android.net.Uri
import androidx.media3.common.util.UnstableApi
import com.azzapp.MainApplication.Companion.getMainApplicationContext
import com.facebook.react.bridge.*


@UnstableApi
class MediaHelpers(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "AZPMediaHelpers"

  @ReactMethod
  fun getVideoSize(uri: String, promise: Promise) {
    var width: Int
    var height: Int
    val rotation: Int
    val uri = try {
      Uri.parse(uri)
    } catch (e: NullPointerException) {
      null
    }
    if (uri == null) {
      promise.reject("INVALID_URI", "provided uri is invalid");
      return
    }
    try {
      val retriever = MediaMetadataRetriever()
      if (uri.scheme == "file") {
        retriever.setDataSource(getMainApplicationContext(), uri)
      } else {
        retriever.setDataSource(uri.toString(), HashMap())
      }
      rotation = try {
        Integer.parseInt(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION) ?: "0")
      } catch (e: NumberFormatException) {
        0
      }
      width = try {
        Integer.parseInt(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH) ?: "0")
      } catch (e: NumberFormatException) {
        0
      }
      height = try {
        Integer.parseInt(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT) ?: "0")
      } catch (e: NumberFormatException) {
        0
      }
      if (rotation == 90 || rotation == 270) {
        val tempWidth = width;
        width = height;
        height = tempWidth;
      }
    } catch (e: Error) {
      promise.reject("failure", "Error while retrieving metadata", e)
      return;
    }
    val map = WritableNativeMap();
    map.putInt("width", width);
    map.putInt("height", height);
    map.putInt("rotation", height);
    promise.resolve(map)
  }

  @ReactMethod
  fun prefetchVideo(uriStr: String, promise: Promise) {
    val uri = try {
      Uri.parse(uriStr)
    } catch (e: NullPointerException) {
      promise.reject("INVALID_URI", "provided uri is invalid")
      return;
    }
    VideoCache.prefetch(uri, promise)
  }

  @ReactMethod
  fun observeVideoPrefetchResult(uriStr: String, promise: Promise) {
    val uri = try {
      Uri.parse(uriStr)
    } catch (e: NullPointerException) {
      promise.reject("INVALID_URI", "provided uri is invalid")
      return;
    }
    VideoCache.observePrefetchResult(uri, promise)
  }

  @ReactMethod
  fun cancelVideoPrefetch(uriStr: String) {
    val uri = try {
      Uri.parse(uriStr)
    } catch (e: NullPointerException) {
      return
    }
    VideoCache.cancelPrefetch(uri)
  }
}