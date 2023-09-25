package com.azzapp.gpu

import android.media.MediaCodecInfo
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.annotations.ReactProp
import com.google.android.exoplayer2.MediaItem
import com.google.android.exoplayer2.transformer.DefaultEncoderFactory
import com.google.android.exoplayer2.transformer.EncoderSelector
import com.google.android.exoplayer2.transformer.TransformationException
import com.google.android.exoplayer2.transformer.TransformationResult
import com.google.android.exoplayer2.transformer.Transformer
import com.google.android.exoplayer2.transformer.VideoEncoderSettings
import com.google.common.collect.ImmutableList
import kotlinx.coroutines.GlobalScope
import java.io.File
import java.util.UUID


class GPUVideoViewManager(
  private val callerContext: ReactApplicationContext
) : SimpleViewManager<GPUVideoView>() {

  override fun getName() = REACT_CLASS

  override fun createViewInstance(context: ThemedReactContext): GPUVideoView =
    GPUVideoView(context)

  override fun onDropViewInstance(view: GPUVideoView) {
    super.onDropViewInstance(view)
    view.release()
  }

  @ReactProp(name = "layers")
  public fun setLayers(view: GPUVideoView, layers: ReadableArray?) {
    view.setLayers(GPULayer.extractLayers(layers))
  }

  @ReactProp(name = "paused")
  public fun setPaused(view: GPUVideoView, paused: Boolean) {
    view.paused = paused
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
    return mutableMapOf(
      ON_PLAYER_START_BUFFERING to mutableMapOf(
        "registrationName" to ON_PLAYER_START_BUFFERING
      ),
      ON_PLAYER_READY to mutableMapOf(
        "registrationName" to ON_PLAYER_READY
      ),
      ON_PROGRESS to mutableMapOf(
        "registrationName" to ON_PROGRESS
      ),
      ON_ERROR to mutableMapOf(
        "registrationName" to ON_ERROR
      ),
    );
  }

  companion object {
    const val REACT_CLASS = "AZPGPUVideoView"
    const val ON_PLAYER_START_BUFFERING = "onPlayerStartBuffing"
    const val ON_PLAYER_READY = "onPlayerReady"
    const val ON_PROGRESS = "onProgress"
    const val ON_ERROR = "onError"
  }
}
