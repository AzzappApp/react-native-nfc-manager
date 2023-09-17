package com.azzapp

import android.content.Context
import android.widget.FrameLayout
import com.azzapp.gl.GLVideoView
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.ThemedReactContext


class AZPEditableVideo(private val reactContext: ThemedReactContext) :
  FrameLayout(reactContext),
  LifecycleEventListener {

  private val videoView = GLVideoView(context)

  init {
    addView(videoView)
    reactContext.addLifecycleEventListener(this)
  }

  fun setUri(value: String?) {
    videoView.setUri(value)
  }

  fun setParameters(value: ReadableMap?) {
    videoView.setParameters(value)
  }

  fun setFilters(value: ReadableArray?) {
    videoView.setFilters(RNHelpers.readableArrayToStringArrayList(value))
  }

  override fun onHostResume() {
    videoView?.resume()
  }

  override fun onHostPause() {
    videoView?.pause()
  }

  override fun onHostDestroy() {
    release()
  }

  fun release() {
    videoView.release()
    reactContext.removeLifecycleEventListener(this)
  }
}
