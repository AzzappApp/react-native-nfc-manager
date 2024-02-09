package com.azzapp.gpu


import com.facebook.react.bridge.*
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp


class GPUImageViewManager(
  private val callerContext: ReactApplicationContext
) : SimpleViewManager<GPUImageView>() {

  override fun getName() = REACT_CLASS

  override fun createViewInstance(context: ThemedReactContext): GPUImageView =
    GPUImageView(context)


  @ReactProp(name = "layers")
  fun setLayers(view: GPUImageView, layers: ReadableArray?) {
    view.setLayers(GPULayer.extractLayers(layers))
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
    return mutableMapOf(
      ON_LOAD to mutableMapOf(
        "registrationName" to ON_LOAD,
      ),
      ON_LOAD_START to mutableMapOf(
        "registrationName" to ON_LOAD_START,
      ),
      ON_ERROR to mutableMapOf(
        "registrationName" to ON_ERROR,
      )
    );
  }

  companion object {
    const val REACT_CLASS = "AZPGPUImageView"
    const val ON_LOAD = "onLoad"
    const val ON_LOAD_START = "onLoadStart"
    const val ON_ERROR = "onError"
  }
}
