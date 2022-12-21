package com.azzapp.gl

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaMetadataRetriever
import android.media.effect.EffectContext
import android.net.Uri
import android.opengl.*
import android.util.Log
import android.webkit.URLUtil
import com.azzapp.RNHelpers
import com.facebook.react.bridge.ReadableMap
import java.io.UnsupportedEncodingException
import java.net.URL
import java.net.URLDecoder
import java.util.*
import java.util.concurrent.atomic.AtomicInteger
import javax.microedition.khronos.egl.*
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.egl.EGLContext
import javax.microedition.khronos.egl.EGLDisplay
import javax.microedition.khronos.opengles.GL10
import kotlin.collections.ArrayList
import kotlin.math.round


class GLImageView(context: Context) : GLSurfaceView(context), GLSurfaceView.Renderer {
  private var source: GPUImageViewSource? = null
  private var sourceChanged = false
  private var sourceImage: GLFrame? = null

  private var parameters: ReadableMap? = null
  private var filters: ArrayList<String>? = null
  private var shouldApplyTransform = true
  private var editKey: String? = null
  private var editedImage: GLFrame? = null
  private var transformedImage: GLFrame? = null


  private var effectContext: EffectContext? = null

  private var surfaceWidth = 0
  private var surfaceHeight = 0

  init {
    setEGLContextFactory(EGLSharedContextFactory(this))
    setEGLConfigChooser(8, 8, 8, 8, 0, 0)
    setEGLContextClientVersion(2)
    setRenderer(this)
    preserveEGLContextOnPause = true
    renderMode = RENDERMODE_WHEN_DIRTY
  }

  fun setSource(value: GPUImageViewSource?) {
    if (value == source) {
      return
    }
    source = value
    sourceChanged = true
    requestRender()
  }

  fun setParameters(value: ReadableMap?) {
    if (parameters == value) {
      return
    }
    parameters = value
    shouldApplyTransform = true
    requestRender()
  }

  fun setFilters(value: ArrayList<String>?) {
    if (filters == value) {
      return
    }
    filters = value
    shouldApplyTransform = true
    requestRender()
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
      sourceImage = gpuImageFromSource(context, source)
    }

    var image = this.sourceImage ?: return

    if (effectContext == null) {
      effectContext = EffectContext.createWithCurrentGlContext()
    }
    transformedImage?.release()
    transformedImage = null

    if (parameters != null) {
      synchronized(GLImageView) {
        val editKey = "${source}-${RNHelpers.readableMapToString(parameters!!)}"
        if (editKey != this.editKey) {
          this.editKey = editKey
          editedImage?.release()
          editedImage = GLFrame.sharedFrame(editKey) {
            AZPTransformations.applyEditorTransform(
              image,
              parameters,
              effectContext!!.factory
            )
          }
        }
        image = editedImage ?: image
      }
    }

    if (filters != null) {
      for (filter in filters!!) {
        val transform = AZPTransformations.transformationForName(filter)
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

  private fun clean() {
    sourceImage?.release()
    sourceImage = null
    editedImage?.release()
    editedImage = null
    transformedImage?.release()
    transformedImage = null
    effectContext?.release()
    effectContext = null
  }

  class GPUImageViewSource(
    val uri: String,
    val kind: String,
    val videoTime: Int?,
  ) {
    override fun toString() =
      if (kind == "video") "video-$uri-${videoTime ?: 0}" else "image-$uri"

    override fun equals(other: Any?): Boolean {
      return other === this ||
          (other is GPUImageViewSource &&
              other.uri == uri &&
              other.kind == kind &&
              other.videoTime == videoTime)
    }

    override fun hashCode(): Int =
      Objects.hash(uri, kind, videoTime)
  }

  companion object {
    private var sharedContext: EGLContext? = null
    private var sharedContextDisplay: EGLDisplay? = null
    private var contextRefCount = AtomicInteger(0)
    private var textureRenderer: TextureRenderer? = null


    fun getSharedContext(): EGLContext = sharedContext ?: EGL10.EGL_NO_CONTEXT


    private class EGLSharedContextFactory(private val view: GLImageView) : EGLContextFactory {

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

        synchronized(GLImageView) {
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

        synchronized(GLImageView) {
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

    private fun gpuImageFromSource(context: Context, source: GPUImageViewSource?): GLFrame? {
      if (source == null) {
        return null
      }
      synchronized(GLImageView) {
        return GLFrame.sharedFrame(source.toString()) {
          val bitmap: Bitmap? = if (source.kind == "video") {
            getBitmapAtTime(context, source.uri, source.videoTime ?: 0)
          } else {
            BitmapFactory.decodeStream(URL(source.uri).openConnection().getInputStream())
          }
          if (bitmap == null) {
            return@sharedFrame null
          }

          val image = GLFrame.create(bitmap.width, bitmap.height)
          ShaderUtils.bindImageTexture(image.texture, bitmap)
          image
        }
      }
    }

    private fun getBitmapAtTime(
      context: Context,
      filePath: String,
      time: Int,
    ): Bitmap? {
      val retriever = MediaMetadataRetriever()
      if (URLUtil.isFileUrl(filePath)) {
        val decodedPath = try {
          URLDecoder.decode(filePath, "UTF-8")
        } catch (e: UnsupportedEncodingException) {
          filePath
        }
        retriever.setDataSource(decodedPath.replace("file://", ""))
      } else if (filePath.contains("content://")) {
        retriever.setDataSource(context, Uri.parse(filePath))
      } else {
        Log.w("GPUImageView", "Remote videos are not supported")
        return null
      }
      val image =
        retriever.getFrameAtTime(
          (time * 1000).toLong(),
          MediaMetadataRetriever.OPTION_CLOSEST_SYNC
        )
      retriever.release()
      return image
    }
  }
}
