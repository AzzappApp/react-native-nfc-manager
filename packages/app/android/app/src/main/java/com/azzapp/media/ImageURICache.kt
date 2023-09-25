package com.azzapp.media

import android.util.LruCache
import java.io.File
import kotlin.math.abs

object ImageURICache {
  // size used to identify local file
  private const val LOCAL_FILE_SIZE = -1.0;

  private val uriCache = LruCache<String, MutableMap<Double, String>>(1000)

  fun queryURICache(mediaId: String, requestedSize: Double): Pair<String, Double>? {
    val mediaCache = uriCache[mediaId] ?: return null;
    var uri: String? = null;
    var currentUriSize = 0.0
    val localUri = mediaCache[LOCAL_FILE_SIZE];
    if (localUri != null) {
      if (File(localUri).exists()) {
        return Pair(localUri, LOCAL_FILE_SIZE)
      }
      removeURICacheEntry(mediaId, LOCAL_FILE_SIZE)
    }
    mediaCache.map {
      if (abs(it.key - requestedSize) < abs(currentUriSize - requestedSize)) {
        uri = it.value
        currentUriSize = it.key
      }
    }

    if (uri == null) {
      return null
    }
    return Pair(uri!!, currentUriSize)
  };

  fun addCacheEntry(mediaId: String, size:Double, uri: String) {
    if (uriCache[mediaId] == null) {
      uriCache.put(mediaId, mutableMapOf(size to uri))
    } else {
      uriCache[mediaId]!!.put(size, uri)
    }
  }

  fun addLocalCacheEntry(mediaId: String, uri: String) {
    addCacheEntry(mediaId, LOCAL_FILE_SIZE, uri)
  }

  fun removeURICacheEntry(mediaId: String, size: Double) {
    val mediaCache = uriCache[mediaId] ?: return;
    mediaCache.remove(size)
    if (mediaCache.isEmpty()) {
      uriCache.remove(mediaId)
    }
  }
}