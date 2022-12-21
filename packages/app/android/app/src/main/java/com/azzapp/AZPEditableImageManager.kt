package com.azzapp


import com.facebook.react.bridge.*
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp


class AZPEditableImageManager(
  callerContext: ReactApplicationContext
) : SimpleViewManager<AZPEditableImage>() {

  override fun getName() = REACT_CLASS

  override fun createViewInstance(context: ThemedReactContext): AZPEditableImage =
    AZPEditableImage(context)


  @ReactProp(name = "source")
  public fun setSource(view: AZPEditableImage, source: ReadableMap?) {
    view.setSource(source)
  }

  @ReactProp(name = "editionParameters")
  public fun setEditionParameters(view: AZPEditableImage, editionParameters: ReadableMap?) {
    view.setParameters(editionParameters)
  }

  @ReactProp(name = "filters")
  public fun setFilters(view: AZPEditableImage, filters: ReadableArray?) {
    view.setFilters(filters)
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
    return mutableMapOf(
      AZPEditableImageManager.ON_LOAD to mutableMapOf(
        "registrationName" to AZPEditableImageManager.ON_LOAD
      ),
    );
  }

  companion object {
    const val REACT_CLASS = "AZPEditableImage"
    const val ON_LOAD = "onLoad"
  }
}
