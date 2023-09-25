package com.azzapp.media

import android.content.Context
import android.graphics.PorterDuff.Mode
import android.graphics.drawable.Drawable
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


class MediaImageRenderer(context: Context) : AppCompatImageView(context) {
  private var mNeedsReload = false
  private var mSource: MediaImageSource? = null

  fun setSource(source: ReadableMap?) {
    var newSource: MediaImageSource? = null;
    if (source != null) {
      val mediaId = source.getString("mediaId")
      val uri = source.getString("uri")
      val requestedSize = source.getDouble("requestedSize")
      if (mediaId != null && uri != null && requestedSize != null) {
        newSource = MediaImageSource(mediaId, uri, requestedSize)
      }
    }
    mNeedsReload = newSource != mSource
    mSource = newSource;
  }

  fun setTintColor(color: Int?) {
    if (color == null) {
      this.clearColorFilter();
    } else {
      this.setColorFilter(color, Mode.SRC_IN);
    }
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

    val cacheEntry = ImageURICache.queryURICache(mSource!!.mediaId, mSource!!.requestedSize)

    val context = context as ThemedReactContext
    val viewId = this.id

    var thumbnail: RequestBuilder<Drawable>? = null;
    if (cacheEntry != null && cacheEntry!!.second !== mSource!!.requestedSize) {
      thumbnail = requestManager
        .load(cacheEntry.first)
        .onlyRetrieveFromCache(true)
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
              MediaImageRendererManager.ON_PLACE_HOLDER_IMAGE_LOAD,
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
          val source = mSource
          if (source != null) {
            ImageURICache.addCacheEntry(source.mediaId, source.requestedSize, source.uri)
          }
          eventListener.receiveEvent(
            viewId,
            MediaImageRendererManager.ON_LOAD,
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
            MediaImageRendererManager.ON_ERROR,
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
    val mediaId: String,
    val uri: String,
    val requestedSize: Double
  ) {
    override fun equals(other: Any?): Boolean {
      return other === this ||
          (other is MediaImageSource &&
              other.uri == uri &&
              other.mediaId == mediaId &&
              other.requestedSize == requestedSize)
    }
  }
}