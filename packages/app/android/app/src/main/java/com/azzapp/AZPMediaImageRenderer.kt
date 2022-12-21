package com.azzapp

import android.content.Context
import android.graphics.drawable.Drawable
import android.util.LruCache
import androidx.appcompat.widget.AppCompatImageView
import com.bumptech.glide.RequestBuilder
import com.bumptech.glide.RequestManager
import com.bumptech.glide.load.DataSource
import com.bumptech.glide.load.engine.GlideException
import com.bumptech.glide.request.Request
import com.bumptech.glide.request.RequestListener
import com.bumptech.glide.request.target.Target
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter
import kotlin.math.abs


class AZPMediaImageRenderer(context: Context) : AppCompatImageView(context) {
  private var mNeedsReload = false
  private var mSource: MediaImageSource? = null

  fun setSource(source: ReadableMap?) {
    var newSource: MediaImageSource? = null;
    if (source != null) {
      val mediaID = source.getString("mediaID")
      val uri = source.getString("uri")
      val requestedSize = source.getDouble("requestedSize")
      if (mediaID != null && uri != null && requestedSize != null) {
        newSource = MediaImageSource(mediaID, uri, requestedSize)
      }
    }
    mNeedsReload = newSource != mSource
    mSource = newSource;
  }

  fun onAfterUpdate(requestManager: RequestManager) {
    if (!mNeedsReload) {
      return
    }
    if (mSource == null) {
      // Cancel existing requests.
      clearView(requestManager)
      setImageDrawable(null)
      return
    }

    val cacheEntry = queryURICache(mSource!!.mediaID, mSource!!.requestedSize)

    val context = context as ThemedReactContext
    val viewId = this.id

    var thumbnail: RequestBuilder<Drawable>? = null;
    if (cacheEntry != null && cacheEntry!!.second !== mSource!!.requestedSize) {
      thumbnail = requestManager
        .load(cacheEntry.first)
        .listener(object : RequestListener<Drawable> {
          override fun onResourceReady(
            resource: Drawable?,
            model: Any?,
            target: Target<Drawable>?,
            dataSource: DataSource?,
            isFirstResource: Boolean
          ): Boolean {
            val eventListener = context.getJSModule(RCTEventEmitter::class.java)
            eventListener.receiveEvent(
              viewId,
              AZPMediaImageRendererManager.ON_PLACE_HOLDER_IMAGE_LOAD,
              WritableNativeMap()
            )
            return false
          }

          override fun onLoadFailed(
            e: GlideException?,
            model: Any?,
            target: Target<Drawable>?,
            isFirstResource: Boolean
          ): Boolean {
            // ignored
            return true
          }
        })
    }

    clearView(requestManager)
    requestManager
      .load(mSource!!.uri)
      .listener(object : RequestListener<Drawable> {
        override fun onResourceReady(
          resource: Drawable?,
          model: Any?,
          target: Target<Drawable>?,
          dataSource: DataSource?,
          isFirstResource: Boolean
        ): Boolean {
          val eventListener = context.getJSModule(RCTEventEmitter::class.java)
          eventListener.receiveEvent(
            viewId,
            AZPMediaImageRendererManager.ON_LOAD,
            WritableNativeMap()
          )
          return false
        }

        override fun onLoadFailed(
          e: GlideException?,
          model: Any?,
          target: Target<Drawable>?,
          isFirstResource: Boolean
        ): Boolean {
          val eventListener = context.getJSModule(RCTEventEmitter::class.java)
          val params: WritableMap = WritableNativeMap()
          params.putString("error", e?.message)
          eventListener.receiveEvent(
            viewId,
            AZPMediaImageRendererManager.ON_ERROR,
            params
          )
          return false
        }
      })
      .thumbnail(thumbnail)
      .into(this)
  }

  fun clearView(requestManager: RequestManager?) {
    if (requestManager != null && tag != null && tag is Request) {
      requestManager.clear(this)
    }
  }

  private inner class MediaImageSource(
    val mediaID: String,
    val uri: String,
    val requestedSize: Double
  ) {
    override fun equals(other: Any?): Boolean {
      return other === this ||
          (other is MediaImageSource &&
              other.uri == uri &&
              other.mediaID == mediaID &&
              other.requestedSize == requestedSize)
    }
  }

  companion object {

    private val uriCache = LruCache<String, MutableMap<Double, String>>(1000)

    fun queryURICache(mediaID: String, requestedSize: Double): Pair<String, Double>? {
      val mediaCache = uriCache[mediaID] ?: return null;
      var uri: String? = null;
      var currentUriSize = 0.0
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

    fun addURICacheEntry(mediaID: String, size: Double, uri: String) {
      if (uriCache[mediaID] == null) {
        uriCache.put(mediaID, mutableMapOf(size to uri))
      } else {
        uriCache[mediaID]!!.put(size, uri)
      }
    }

    fun removeURICacheEntry(mediaID: String, size: Double) {
      val mediaCache = uriCache[mediaID] ?: return;
      mediaCache.remove(size)
      if (mediaCache.isEmpty()) {
        uriCache.remove(mediaID)
      }
    }
  }
}