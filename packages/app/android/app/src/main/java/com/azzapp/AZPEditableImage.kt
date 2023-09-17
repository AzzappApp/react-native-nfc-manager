package com.azzapp

import android.content.Context
import android.widget.FrameLayout
import com.azzapp.gl.GLImageView
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType

class AZPEditableImage(context: Context) : FrameLayout(context) {

  private val imageView = GLImageView(context)

  init {
    addView(imageView)
  }

  fun setSource(value: ReadableMap?) {
    if (value != null) {
      val uri = value.getString("uri");
      val kind = value.getString("kind") ?: "image";
      val videoTime =
        if (value.hasKey("videoTime"))
          value.getInt("videoTime")
        else
          if (kind == "video") 0 else null;

      if (uri !== null) {
        imageView.setSource(GLImageView.GPUImageViewSource(uri, kind, videoTime))
        return;
      } else {
        // TODO warn
      }
    }
    imageView.setSource(null)
  }

  fun setParameters(value: ReadableMap?) {
    imageView.setParameters(value)
  }

  fun setFilters(value: ReadableArray?) {
    imageView.setFilters(RNHelpers.readableArrayToStringArrayList(value))
  }
}
