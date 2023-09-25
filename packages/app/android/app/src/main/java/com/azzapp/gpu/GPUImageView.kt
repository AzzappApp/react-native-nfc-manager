package com.azzapp.gpu

import android.content.Context
import android.graphics.Bitmap
import android.media.effect.EffectContext
import android.opengl.GLES20
import android.opengl.GLSurfaceView
import android.util.Log
import android.widget.FrameLayout
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.async
import java.util.concurrent.atomic.AtomicInteger
import javax.microedition.khronos.egl.EGL10
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.egl.EGLContext
import javax.microedition.khronos.egl.EGLDisplay
import javax.microedition.khronos.opengles.GL10
import kotlin.math.round

class GPUImageView(context: Context) : FrameLayout(context), GLSurfaceView.Renderer {

  private val surfaceView = GLSurfaceView(context)

  private var layer: GPULayer? = null

  private var sourceBitmap: Bitmap? = null
  private var sourceChanged = false


  private var sourceImage: GLFrame? = null
  private var editKey: String? = null
  private var editedImage: GLFrame? = null
  private var transformedImage: GLFrame? = null


  private var effectContext: EffectContext? = null

  private var surfaceWidth = 0
  private var surfaceHeight = 0


  init {

    surfaceView.setEGLContextFactory(EGLSharedContextFactory(this))
    surfaceView.setEGLConfigChooser(8, 8, 8, 8, 0, 0)
    surfaceView.setEGLContextClientVersion(2)
    surfaceView.setRenderer(this)
    surfaceView.preserveEGLContextOnPause = true
    surfaceView.renderMode = GLSurfaceView.RENDERMODE_WHEN_DIRTY

    addView(surfaceView)
  }

  fun getLayers(): List<GPULayer>? {
    val layer = this.layer
    if (layer === null) {
      return null
    }
    //layer
    val layers = mutableListOf<GPULayer>()
    layers.add(layer)
    return layers
  }

  fun setLayers(layers: List<GPULayer>?) {
    if (layers !=null && layers.size > 1) {
      Log.w(TAG, "GPUImageView does not support multiple layers on android")
    }
    setLayer(layers?.last())
  }

  private fun dispatchEvent(event: String, e: Exception?) {
    val context = context as ThemedReactContext
    val eventListener = context.getJSModule(RCTEventEmitter::class.java)
    val params = WritableNativeMap()
    if (e != null) {
      params.putString("error", e?.message)
    }
    eventListener.receiveEvent(
      this.id,
      event,
      params
    )
  }

  fun setLayer(value: GPULayer?) {
    sourceChanged = layer?.source !== value?.source
    layer = value;
    if (sourceChanged) {
      loadSource()
    }
    surfaceView.requestRender()
  }

  override fun onSurfaceCreated(gl: GL10?, config: EGLConfig?) {
    // nothing
  }

  override fun onSurfaceChanged(gl: GL10?, width: Int, height: Int) {
    surfaceWidth = width
    surfaceHeight = height
  }

  override fun onDrawFrame(gl: GL10?) {
    GLES20.glClearColor(0.0f, 0.0f, 0.0f, 1.0f)
    GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT)

    if (sourceChanged) {
      sourceImage?.release()
      editedImage?.release()
      transformedImage?.release()
      sourceImage = null
      transformedImage = null
      sourceChanged = false
    }

    if (sourceImage == null) {
      val bitmap = this.sourceBitmap ?:return
      val layerKey = this.layer?.source?.stringRepresentation() ?:return
      sourceImage = GLFrame.sharedFrame(layerKey) {
        val glFrame = GLFrame.create(bitmap.width, bitmap.height)
        ShaderUtils.bindImageTexture(glFrame.texture, bitmap)
        glFrame
      }
    }

    var image = this.sourceImage ?: return

    if (effectContext == null) {
      effectContext = EffectContext.createWithCurrentGlContext()
    }
    transformedImage?.release()
    transformedImage = null

    val parameters = layer?.parameters
    if (parameters != null) {
      synchronized(GPUImageView) {
        val editKey = "${layer!!.source.hashCode()}-${parameters.hashCode()}"
        if (editKey != this.editKey) {
          this.editKey = editKey
          editedImage?.release()
          editedImage = GLFrame.sharedFrame(editKey) {
            GLFrameTransformations.applyEditorTransform(
              image,
              parameters,
              effectContext!!.factory
            )
          }
        }
        image = editedImage ?: image
      }
    }

    val filters = layer?.filters
    if (filters != null) {
      for (filter in filters) {
        val transform = GLFrameTransformations.transformationForName(filter)
        if (transform != null) {
          this.transformedImage = transform(
            image,
            this.transformedImage,
            null,
            effectContext!!.factory
          )
          image = this.transformedImage ?: image
        }
      }
    }

    textureRenderer?.renderTexture(
      image.texture,
      ShaderUtils.IDENT_MATRIX,
      round(image.x * surfaceWidth.toFloat() / image.width.toFloat()).toInt(),
      -round(image.y * surfaceHeight.toFloat() / image.height.toFloat()).toInt(),
      surfaceWidth,
      surfaceHeight
    )
  }

  private var loadSourceJob: Deferred<Any>? = null
  private fun loadSource() {
    loadSourceJob?.cancel()
    this.sourceBitmap = null
    var source = layer?.source ?:return
    dispatchEvent(GPUImageViewManager.ON_LOAD_START, null)
    loadSourceJob = GlobalScope.async {
      try {
        val bitmap =  GPULayerImageLoader.loadGPULayerSource(source)
        if (source == layer?.source) {
          dispatchEvent(GPUImageViewManager.ON_LOAD, null)
          sourceBitmap = bitmap
          surfaceView.requestRender()
        }
      } catch (e: Exception) {
        if (source == layer?.source) {
          dispatchEvent(GPUImageViewManager.ON_ERROR, e)
        }
      }
    }
  }

  private fun clean() {
    loadSourceJob?.cancel()
    loadSourceJob = null
    sourceImage?.release()
    sourceImage = null
    editedImage?.release()
    editedImage = null
    transformedImage?.release()
    transformedImage = null
    effectContext?.release()
    effectContext = null
  }

  companion object {
    private const val TAG = "GPUImageView"

    private var sharedContext: EGLContext? = null
    private var sharedContextDisplay: EGLDisplay? = null
    private var contextRefCount = AtomicInteger(0)
    private var textureRenderer: TextureRenderer? = null


    fun getSharedContext(): EGLContext = sharedContext ?: EGL10.EGL_NO_CONTEXT


    private class EGLSharedContextFactory(private val view: GPUImageView) :
      GLSurfaceView.EGLContextFactory {

      override fun createContext(
        egl: EGL10,
        display: EGLDisplay?,
        config: EGLConfig?
      ): EGLContext? {
        contextRefCount.incrementAndGet()
        val attrib = intArrayOf(
          ShaderUtils.EGL_CONTEXT_CLIENT_VERSION,
          2,
          EGL10.EGL_NONE
        )

        synchronized(GPUImageView) {
          if (sharedContext == null) {
            sharedContextDisplay = egl.eglGetDisplay(EGL10.EGL_DEFAULT_DISPLAY)
            sharedContext = egl.eglCreateContext(
              sharedContextDisplay,
              config,
              EGL10.EGL_NO_CONTEXT,
              attrib
            )
            egl.eglMakeCurrent(display, EGL10.EGL_NO_SURFACE, EGL10.EGL_NO_SURFACE, sharedContext)
            textureRenderer = TextureRenderer(false, true)
          }
        }

        return egl.eglCreateContext(
          display,
          config,
          sharedContext,
          attrib
        )
      }

      override fun destroyContext(
        egl: EGL10,
        display: EGLDisplay,
        context: EGLContext
      ) {
        egl.eglMakeCurrent(display, EGL10.EGL_NO_SURFACE, EGL10.EGL_NO_SURFACE, context)
        view.clean()
        destroyContextInner(egl, display, context)

        synchronized(GPUImageView) {
          if (contextRefCount.decrementAndGet() < 0 && sharedContext != null) {
            destroyContextInner(egl, sharedContextDisplay!!, sharedContext!!)
            sharedContext = null
            sharedContextDisplay = null
            textureRenderer = null
          }
        }
      }

      fun destroyContextInner(
        egl: EGL10,
        display: EGLDisplay,
        context: EGLContext
      ) {
        if (!egl.eglDestroyContext(display, context)) {
          Log.e("EGLContextManager", "display:$display context: $context")
          val error = egl.eglGetError()
          throw RuntimeException("Error while destroying egl context $error")
        }
      }
    }
  }
}
