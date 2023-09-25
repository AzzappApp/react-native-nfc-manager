package com.azzapp.gpu


import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.media.effect.EffectContext
import android.opengl.EGL14
import android.opengl.GLES20
import android.opengl.GLUtils
import com.azzapp.MainApplication
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.annotations.ReactProp
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.runBlocking
import java.io.File
import java.io.FileOutputStream
import java.nio.ByteBuffer
import java.util.UUID
import javax.microedition.khronos.egl.EGL10
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.egl.EGLContext
import javax.microedition.khronos.egl.EGLDisplay
import javax.microedition.khronos.egl.EGLSurface
import kotlin.math.round


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
