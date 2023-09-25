package com.azzapp.media

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.net.Uri
import android.os.Build
import com.bumptech.glide.Glide
import com.bumptech.glide.RequestManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp


class MediaImageRendererManager(
  private val callerContext: ReactApplicationContext
) : SimpleViewManager<MediaImageRenderer>() {

  private var requestManager: RequestManager? = null

  override fun getName() = REACT_CLASS

  override fun createViewInstance(context: ThemedReactContext): MediaImageRenderer {
    if (isValidContextForGlide(context)) {
      requestManager = Glide.with(context);
    }
    return MediaImageRenderer(context);
  }

  @ReactProp(name = "source")
  fun setSource(view: MediaImageRenderer, source: ReadableMap?) {
    view.setSource(source)
  }

  @ReactProp(name = "tintColor", customType = "Color")
  fun  setTintColor(view: MediaImageRenderer, tintColor: Int?) {
    view.setTintColor(tintColor)
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
    return mutableMapOf(
      ON_LOAD to mutableMapOf(
        "registrationName" to ON_LOAD
      ),
      ON_PLACE_HOLDER_IMAGE_LOAD to mutableMapOf(
        "registrationName" to ON_PLACE_HOLDER_IMAGE_LOAD
      ),
      ON_ERROR to mutableMapOf(
        "registrationName" to ON_ERROR
      ),
    );
  }

  override fun onAfterUpdateTransaction(view: MediaImageRenderer) {
    super.onAfterUpdateTransaction(view)
    view.onAfterUpdate(requestManager!!)
  }

  override fun onDropViewInstance(view: MediaImageRenderer) {
    // This will cancel existing requests.
    view.clearView(requestManager)
    super.onDropViewInstance(view)
  }

  companion object {
    const val REACT_CLASS = "AZPMediaImageRenderer"

    const val ON_PLACE_HOLDER_IMAGE_LOAD = "onPlaceHolderImageLoad"
    const val ON_LOAD = "onLoad"
    const val ON_ERROR = "onError"

    private fun isValidContextForGlide(context: Context): Boolean {
      val activity: Activity = getActivityFromContext(context) ?: return false
      return !isActivityDestroyed(activity)
    }

    private fun getActivityFromContext(context: Context): Activity? {
      if (context is Activity) {
        return context
      }
      if (context is ThemedReactContext) {
        val baseContext = (context as ThemedReactContext).baseContext
        if (baseContext is Activity) {
          return baseContext
        }
        if (baseContext is ContextWrapper) {
          val contextWrapper = baseContext as ContextWrapper
          val wrapperBaseContext: Context = contextWrapper.baseContext
          if (wrapperBaseContext is Activity) {
            return wrapperBaseContext
          }
        }
      }
      return null
    }

    private fun isActivityDestroyed(activity: Activity): Boolean {
      return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
        activity.isDestroyed || activity.isFinishing
      } else {
        activity.isFinishing || activity.isChangingConfigurations
      }
    }
  }
}
