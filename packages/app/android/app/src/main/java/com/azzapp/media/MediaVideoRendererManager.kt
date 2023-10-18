package com.azzapp.media

import android.net.Uri
import androidx.media3.common.util.UnstableApi
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

@UnstableApi class MediaVideoRendererManager(
  private val callerContext: ReactApplicationContext
) : SimpleViewManager<MediaVideoRenderer>() {
  override fun getName() = REACT_CLASS

  override fun createViewInstance(context: ThemedReactContext) =
    MediaVideoRenderer(context)

  override fun onDropViewInstance(view: MediaVideoRenderer) {
    super.onDropViewInstance(view)
    view.release()
  }

  @ReactProp(name = "source")
  fun setSource(view: MediaVideoRenderer, source: ReadableMap?) {
    view.setSource(source)
  }

  @ReactProp(name = "muted")
  fun setMuted(view: MediaVideoRenderer, muted: Boolean?) {
    view.setMuted(muted)
  }

  @ReactProp(name = "paused")
  fun setPaused(view: MediaVideoRenderer, paused: Boolean?) {
    view.setPaused(paused)
  }

  @ReactProp(name = "currentTime")
  fun setCurrentTime(view: MediaVideoRenderer, currentTime: Int?) {
    view.setCurrentTime(currentTime)
  }


  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
    return mutableMapOf(
      ON_LOADING_START to mutableMapOf(
        "registrationName" to ON_LOADING_START
      ),
      ON_READY_FOR_DISPLAY to mutableMapOf(
        "registrationName" to ON_READY_FOR_DISPLAY
      ),
      ON_END to mutableMapOf(
        "registrationName" to ON_END
      ),
      // TODO not implemented yet
      ON_PROGRESS to mutableMapOf(
        "registrationName" to ON_PROGRESS
      ),
      ON_SEEK_COMPLETE to mutableMapOf(
        "registrationName" to ON_SEEK_COMPLETE
      ),
      ON_ERROR to mutableMapOf(
        "registrationName" to ON_ERROR
      ),
    );
  }

  companion object {
    const val REACT_CLASS = "AZPMediaVideoRenderer"

    const val ON_LOADING_START = "onLoadingStart"
    const val ON_READY_FOR_DISPLAY = "onReadyForDisplay"
    const val ON_END = "onEnd"
    const val ON_ERROR = "onError"
    const val ON_PROGRESS = "onProgress"
    const val ON_SEEK_COMPLETE = "onSeekComplete"
  }
}

