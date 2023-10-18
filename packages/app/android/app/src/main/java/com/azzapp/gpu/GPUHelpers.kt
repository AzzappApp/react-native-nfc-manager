package com.azzapp.gpu

import android.graphics.Bitmap
import android.media.MediaCodecInfo
import android.media.effect.EffectContext
import android.opengl.EGL14
import android.opengl.GLES20
import android.opengl.GLUtils
import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.transformer.Composition
import androidx.media3.transformer.DefaultEncoderFactory
import androidx.media3.transformer.EditedMediaItem
import androidx.media3.transformer.EncoderSelector
import androidx.media3.transformer.ExportException
import androidx.media3.transformer.ExportResult
import androidx.media3.transformer.TransformationRequest
import androidx.media3.transformer.TransformationRequest.HDR_MODE_KEEP_HDR
import androidx.media3.transformer.Transformer
import androidx.media3.transformer.VideoEncoderSettings
import com.azzapp.MainApplication
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.UIManagerHelper
import com.google.common.collect.ImmutableList
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
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


@UnstableApi class GPUHelpers(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "AZPGPUHelpers"


  @ReactMethod
  fun exportVideoFromView(
    viewId: Int,
    size: ReadableMap,
    bitRate: Int,
    removeAudio: Boolean,
    promise: Promise
  ) {
    val view = UIManagerHelper.getUIManager(reactContext, viewId)?.resolveView(viewId) as GPUVideoView?
    if (view == null) {
      promise.reject("FAILED_TO_EXPORT", "GPUImageView is not ready for export")
      return
    }
    val layer = view.getLayers()?.get(0)
    if (layer == null) {
      promise.reject("FAILED_TO_EXPORT", "GPUImageView does not render layer")
      return
    }
    exportVideoLayer(
      layer,
      size,
      bitRate,
      removeAudio,
      promise
    )
  }

  @ReactMethod
  fun exportLayersToVideo(
    layers: ReadableArray,
    backgroundColor: Double,
    size: ReadableMap,
    bitRate: Int,
    removeAudio: Boolean,
    promise: Promise
  ) {

    var layers = GPULayer.extractLayers(layers)
    val layer = layers?.last { it.source.kind === GPULayer.GPULayerKind.VIDEO }
    if (layer == null) {
      promise.reject("FAILED_TO_EXPORT", "GPUImageView does not render layer")
      return
    }
    exportVideoLayer(
      layer,
      size,
      bitRate,
      removeAudio,
      promise
    )
  }

  private fun exportVideoLayer(
    layer: GPULayer,
    size: ReadableMap,
    bitRate: Int,
    removeAudio: Boolean,
    promise: Promise
  ) {
    val transformerRequestBuilder = TransformationRequest.Builder().setHdrMode(HDR_MODE_KEEP_HDR).build()
    val transformer =
    Transformer.Builder(reactContext).setTransformationRequest(transformerRequestBuilder)
      .setVideoFrameProcessorFactory(
        GLExoPlayerFrameProcessor.Factory(
          size.getInt("width"),
          size.getInt("height"),
          layer.parameters,
          layer.filters
        )
      )
      .setEncoderFactory(
        DefaultEncoderFactory.Builder(reactContext)
          .setRequestedVideoEncoderSettings(
            VideoEncoderSettings.Builder().setBitrate(bitRate).build()
          )
          .setVideoEncoderSelector(ExcludingEncoderSelector)
          .setEnableFallback(true)
          .build()
      )
      .build()

    // val startMs = layer.source.startTime?.toLong()?.times(1000L)
    // val endMS = layer.source.startTime?.toLong()?.plus(layer.source.duration?.toLong()?.times(1000L) ?: 0)
    val sourceMediaItem = MediaItem.Builder().setUri(layer.source.uri)

    /*.setClippingConfiguration(MediaItem.ClippingConfiguration.Builder()
            .setStartPositionMs(startMs ?: 0)
            .setEndPositionMs(endMS ?: 0)
            .build())*/

    val editedMediaItem = EditedMediaItem.Builder(sourceMediaItem.build()).setRemoveAudio(removeAudio).build();

    val file = File( reactContext.cacheDir, UUID.randomUUID().toString() + ".mp4")
    check(!(file.exists() && !file.delete())) { "Could not delete the previous export output file" }
    check(file.createNewFile()) { "Could not create the export output file" }

    transformer.addListener(object : Transformer.Listener {
      override fun onCompleted(
        composition: Composition,
        exportResult: ExportResult
      ) {
        super.onCompleted(composition, exportResult)
        promise.resolve(file.absolutePath)
      }

      override fun onError(
               composition: Composition, 
               exportResult:ExportResult, 
               exportException: ExportException) {
        super.onError(composition, exportResult, exportException)
        promise.reject(exportException)
      }
    })

    transformer.start(editedMediaItem, file.absolutePath)
  }

  @ReactMethod
  fun exportImageFromView(
    viewId: Int,
    format: String,
    quality: Double,
    size: ReadableMap,
    promise: Promise
  ) {
    val view = UIManagerHelper.getUIManager(reactContext, viewId)?.resolveView(viewId) as GPUImageView?
    if (view == null) {
      promise.reject("FAILED_TO_EXPORT", "GPUImageView is not ready for export")
      return
    }
    val layer = view.getLayers()?.get(0)
    if (layer == null) {
      promise.reject("FAILED_TO_EXPORT", "GPUImageView does not render layer")
      return
    }
    GlobalScope.launch(Dispatchers.Main) {
      exportImageLayer(
        layer,
        format,
        quality,
        size,
        promise
      )
    }
  }

  @ReactMethod
  fun exportLayersToImage(
    layers: ReadableArray,
    backgroundColor: Double,
    format: String,
    quality: Double,
    size: ReadableMap,
    promise: Promise
  ) {
    var layers = GPULayer.extractLayers(layers)
    val layer = layers?.get(0)
    if (layer == null) {
      promise.reject("FAILED_TO_EXPORT", "GPUImageView does not render layer")
      return
    }
    GlobalScope.launch(Dispatchers.Main) {
      exportImageLayer(
        layer,
        format,
        quality,
        size,
        promise
      )
    }
  }


  private fun exportImageLayer(
    layer: GPULayer,
    format: String,
    quality: Double,
    size: ReadableMap,
    promise: Promise
  ) {
    val egl = EGLContext.getEGL() as EGL10
    var eglContext: EGLContext? = null
    var eglDisplay: EGLDisplay? = null
    var eglSurface: EGLSurface? = null
    var effectContext: EffectContext? = null
    var sourceImage: GLFrame? = null

    try {
      val width = size.getInt("width")
      val height = size.getInt("height")

      eglDisplay = egl.eglGetDisplay(EGL10.EGL_DEFAULT_DISPLAY)

      if (eglDisplay === EGL10.EGL_NO_DISPLAY) {
        val eglError = GLUtils.getEGLErrorString(egl.eglGetError())
        throw RuntimeException("OpenGL Error in eglGetDisplay $eglError")
      }

      val version = IntArray(2)
      if (!egl.eglInitialize(eglDisplay, version)) {
        val eglError = GLUtils.getEGLErrorString(egl.eglGetError())
        throw RuntimeException("OpenGL Error in eglInitialize: $eglError")
      }
      val eglConfigs = arrayOfNulls<EGLConfig>(1)
      val configsCount = IntArray(1)
      val configSpec = intArrayOf(
        EGL10.EGL_RED_SIZE, 8,
        EGL10.EGL_GREEN_SIZE, 8,
        EGL10.EGL_BLUE_SIZE, 8,
        EGL10.EGL_ALPHA_SIZE, 8,
        EGL10.EGL_DEPTH_SIZE, 16,
        EGL10.EGL_STENCIL_SIZE, 0,
        EGL10.EGL_RENDERABLE_TYPE, EGL14.EGL_OPENGL_ES2_BIT,
        EGL10.EGL_SURFACE_TYPE, EGL10.EGL_PBUFFER_BIT,
        EGL10.EGL_NONE
      )
      if ((!egl.eglChooseConfig(
          eglDisplay,
          configSpec,
          eglConfigs,
          1,
          configsCount
        )) || (configsCount[0] == 0)
      ) {
        val eglError = GLUtils.getEGLErrorString(egl.eglGetError())
        promise.reject("Export error", "OpenGL eglChooseConfig: $eglError")
        return
      }

      val config = eglConfigs[0]
        ?: throw RuntimeException("OpenGL Error in eglConfig not Initialized")

      val attrib = intArrayOf(EGL14.EGL_CONTEXT_CLIENT_VERSION, 2, EGL10.EGL_NONE)


      eglSurface = egl.eglCreatePbufferSurface(
        eglDisplay, config, intArrayOf(
          EGL10.EGL_WIDTH, width,
          EGL10.EGL_HEIGHT, height,
          EGL10.EGL_NONE
        )
      )
      if (eglSurface == EGL10.EGL_NO_SURFACE) {
        val eglError = GLUtils.getEGLErrorString(egl.eglGetError())
        throw RuntimeException("OpenGL Error in eglConfig eglCreatePbufferSurface(): $eglError")
      }

      eglContext =
        egl.eglCreateContext(
          eglDisplay,
          config,
          GPUImageView.getSharedContext(),
          attrib
        )

      if (!egl.eglMakeCurrent(eglDisplay, eglSurface, eglSurface, eglContext)) {
        val eglError = GLUtils.getEGLErrorString(egl.eglGetError())
        throw RuntimeException("OpenGL Error in eglConfig eglMakeCurrent(): $eglError")
      }

      var loadedBitmap: Bitmap? = null
      runBlocking {
        try {
          loadedBitmap = GPULayerImageLoader.loadGPULayerSource(layer.source)
        } catch (e: Exception) {
          promise.reject(e)
        }
      }
      val inputBitmap = loadedBitmap ?:return
      sourceImage = GLFrame.create(inputBitmap.width, inputBitmap.height)
      ShaderUtils.bindImageTexture(sourceImage.texture, inputBitmap)

      val parameters = layer.parameters
      if (parameters != null) {
        effectContext = EffectContext.createWithCurrentGlContext()
        val croppedImage = GLFrameTransformations.applyEditorTransform(
          sourceImage,
          parameters,
          effectContext.factory
        )
        if (croppedImage != null) {
          sourceImage.release()
          sourceImage = croppedImage
        }

        val filters = layer.filters
        if (filters != null) {
          for (filter in filters!!) {
            val transform = GLFrameTransformations.transformationForName(filter)
            if (transform != null) {
              transform(
                sourceImage,
                sourceImage,
                null,
                effectContext.factory
              )
            }
          }
        }
      }

      var bitmap = saveTexture(sourceImage.texture, sourceImage.width, sourceImage.height)
      val file = File.createTempFile(UUID.randomUUID().toString(), ".jpg", MainApplication.getMainApplicationContext().cacheDir)
      if (file.exists()) file.delete()
      val out = FileOutputStream(file)
      bitmap = Bitmap.createScaledBitmap(bitmap, width, height, true)
      bitmap.compress(Bitmap.CompressFormat.JPEG, round(quality).toInt(), out)
      out.flush()
      out.close()
      promise.resolve(file.absolutePath)
    } catch (e: Exception) {
      promise.reject(e)
    } finally {
      sourceImage?.release()
      effectContext?.release()
      if (eglSurface != null && eglSurface != EGL10.EGL_NO_SURFACE) {
        egl.eglDestroySurface(eglDisplay, eglSurface)
      }
      if (eglContext != null && eglContext != EGL10.EGL_NO_CONTEXT) {
        egl.eglDestroyContext(eglDisplay, eglContext)
      }
    }
  }

  private fun saveTexture(texture: Int, width: Int, height: Int): Bitmap {
    val frame = IntArray(1)
    GLES20.glGenFramebuffers(1, frame, 0)
    GLES20.glBindFramebuffer(GLES20.GL_FRAMEBUFFER, frame[0])
    GLES20.glFramebufferTexture2D(
      GLES20.GL_FRAMEBUFFER,
      GLES20.GL_COLOR_ATTACHMENT0, GLES20.GL_TEXTURE_2D, texture,
      0
    )
    val buffer: ByteBuffer = ByteBuffer.allocate(width * height * 4)
    GLES20.glReadPixels(
      0, 0, width, height, GLES20.GL_RGBA,
      GLES20.GL_UNSIGNED_BYTE, buffer
    )
    val bitmap = Bitmap.createBitmap(
      width, height,
      Bitmap.Config.ARGB_8888
    )
    bitmap.copyPixelsFromBuffer(buffer)
    GLES20.glBindFramebuffer(GLES20.GL_FRAMEBUFFER, 0)
    GLES20.glDeleteFramebuffers(1, frame, 0)
    return bitmap
  }

  private object ExcludingEncoderSelector : EncoderSelector {

    private val EXCLUDED_ENCODERS = ArrayList<String>(0)

    override fun selectEncoderInfos(mimeType: String): ImmutableList<MediaCodecInfo> {
      return  ImmutableList.copyOf(
        EncoderSelector.DEFAULT
          .selectEncoderInfos(mimeType)
          .filter { !EXCLUDED_ENCODERS.contains(it.name) }
      )
    }
  }
}