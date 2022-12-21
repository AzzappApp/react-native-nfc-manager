package com.azzapp

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class AZPMediaVideoRendererManager(
  private val callerContext: ReactApplicationContext
) : SimpleViewManager<AZPMediaVideoRenderer>() {
  override fun getName() = REACT_CLASS

  override fun createViewInstance(context: ThemedReactContext) =
    AZPMediaVideoRenderer(context)

  override fun onDropViewInstance(view: AZPMediaVideoRenderer) {
    super.onDropViewInstance(view)
    view.release()
  }

  @ReactProp(name = "uri")
  fun setURI(view: AZPMediaVideoRenderer, uri: String?) {
    view.setURI(uri)
  }

  @ReactProp(name = "muted")
  fun setMuted(view: AZPMediaVideoRenderer, muted: Boolean?) {
    view.setMuted(muted)
  }

  @ReactProp(name = "paused")
  fun setPaused(view: AZPMediaVideoRenderer, paused: Boolean?) {
    view.setPaused(paused)
  }

  @ReactProp(name = "currentTime")
  fun setCurrentTime(view: AZPMediaVideoRenderer, currentTime: Int?) {
    view.setCurrentTime(currentTime)
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
    return mutableMapOf(
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
    const val ON_READY_FOR_DISPLAY = "onReadyForDisplay"
    const val ON_END = "onEnd"
    const val ON_ERROR = "onError"
    const val ON_PROGRESS = "onProgress"
    const val ON_SEEK_COMPLETE = "onSeekComplete"
  }
}
