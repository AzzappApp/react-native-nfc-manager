package com.azzapp

import com.facebook.react.bridge.*
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp


class AZPEditableVideoManager(
  callerContext: ReactApplicationContext
) : SimpleViewManager<AZPEditableVideo>() {

  override fun getName() = REACT_CLASS

  override fun createViewInstance(context: ThemedReactContext): AZPEditableVideo =
    AZPEditableVideo(context)

  override fun onDropViewInstance(view: AZPEditableVideo) {
    super.onDropViewInstance(view)
    view.release()
  }

  @ReactProp(name = "uri")
  public fun setUri(view: AZPEditableVideo, uri: String?) {
    view.setUri(uri)
  }

  @ReactProp(name = "editionParameters")
  public fun setEditionParameters(view: AZPEditableVideo, editionParameters: ReadableMap?) {
    view.setParameters(editionParameters)
  }

  @ReactProp(name = "filters")
  public fun setFilters(view: AZPEditableVideo, filters: ReadableArray?) {
    view.setFilters(filters)
  }

  @ReactProp(name = "startTime")
  public fun setStartTime(view: AZPEditableVideo, startTime: Int?) {

  }

  @ReactProp(name = "duration")
  public fun setDuration(view: AZPEditableVideo, duration: Int?) {

  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
    return mutableMapOf(
      AZPEditableVideoManager.ON_LOAD to mutableMapOf(
        "registrationName" to AZPEditableVideoManager.ON_LOAD
      ),
    );
  }

  companion object {
    const val REACT_CLASS = "AZPEditableVideo"
    const val ON_LOAD = "onLoad"
  }
}
