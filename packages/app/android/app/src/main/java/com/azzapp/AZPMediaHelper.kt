package com.azzapp

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaCodecInfo
import android.media.MediaMetadataRetriever
import android.media.effect.EffectContext
import android.net.Uri
import android.opengl.EGL14
import android.opengl.GLES20
import android.opengl.GLUtils
import com.azzapp.gl.*
import com.facebook.react.bridge.*
import com.google.android.exoplayer2.MediaItem
import com.google.android.exoplayer2.transformer.*
import com.google.common.collect.ImmutableList
import okhttp3.internal.toImmutableList
import java.io.File
import java.io.FileOutputStream
import java.net.URL
import java.nio.ByteBuffer
import java.util.*
import javax.microedition.khronos.egl.*


class AZPMediaHelper(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "AZPMediaHelper"

  @ReactMethod
  fun getVideoSize(uri: Uri, promise: Promise) {
    val width: Int
    val height: Int
    try {
      val metaRetriever = MediaMetadataRetriever()
      metaRetriever.setDataSource(uri.path)
      val frame: Bitmap? = metaRetriever.frameAtTime
      if (frame == null) {
        promise.reject("failure", "Could not find video", null)
        return
      }
      width = frame.width
      height = frame.height
    } catch (e: Error) {
      promise.reject("failure", "Error while retrieving metadata", e)
      return;
    }
    promise.resolve(mapOf("width" to width, "height" to height))
  }


  @ReactMethod
  fun exportImage(
    uri: String,
    parameters: ReadableMap?,
    filters: ReadableArray?,
    format: String,
    quality: Int,
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
          GLImageView.getSharedContext(),
          attrib
        )

      if (!egl.eglMakeCurrent(eglDisplay, eglSurface, eglSurface, eglContext)) {
        val eglError = GLUtils.getEGLErrorString(egl.eglGetError())
        throw RuntimeException("OpenGL Error in eglConfig eglMakeCurrent(): $eglError")
      }

      val inputBitmap = BitmapFactory.decodeStream(URL(uri).openConnection().getInputStream())
      sourceImage = GLFrame.create(inputBitmap.width, inputBitmap.height)
      ShaderUtils.bindImageTexture(sourceImage.texture, inputBitmap)

      if (parameters != null) {
        effectContext = EffectContext.createWithCurrentGlContext()
        val croppedImage = AZPTransformations.applyEditorTransform(
          sourceImage,
          parameters,
          effectContext.factory
        )
        if (croppedImage != null) {
          sourceImage.release()
          sourceImage = croppedImage
        }

        val filterList = RNHelpers.readableArrayToStringArrayList(filters)
        if (filterList != null) {
          for (filter in filterList!!) {
            val transform = AZPTransformations.transformationForName(filter)
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
      val file = File.createTempFile(UUID.randomUUID().toString(), ".jpg", reactContext.cacheDir)
      if (file.exists()) file.delete()
      val out = FileOutputStream(file)
      bitmap = Bitmap.createScaledBitmap(bitmap, width, height, true)
      bitmap.compress(Bitmap.CompressFormat.JPEG, quality, out)
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

  companion object {
    fun saveTexture(texture: Int, width: Int, height: Int): Bitmap {
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
  }



  @ReactMethod
  fun exportVideo(
    uri: String,
    parameters: ReadableMap?,
    filters: ReadableArray?,
    size: ReadableMap,
    bitRate: Int,
    startTime: Int,
    duration: Int,
    removeAudio: Boolean,
    promise: Promise
  ) {

    val transformer = Transformer.Builder(reactContext)
      .setRemoveAudio(removeAudio)
      .setFrameProcessorFactory(
        GLExoPlayerFrameProcessor.Factory(
          size.getInt("width"),
          size.getInt("height"),
          parameters,
          RNHelpers.readableArrayToStringArrayList(filters)
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

    val startMs = startTime * 1000L
    val endMS = startTime + duration * 1000L
    var inputMediaItem = MediaItem.fromUri(uri)

    /*MediaItem.Builder()
      .setUri(uri)
      .setClippingConfiguration(
        MediaItem.ClippingConfiguration.Builder()
          .setStartPositionMs(startMs)
          .setEndPositionMs(endMS)
          .build()
      ).build()*/


    val file = File.createTempFile(UUID.randomUUID().toString(), ".mp4", reactContext.cacheDir)
    if (file.exists()) file.delete()

    transformer.addListener(object : Transformer.Listener {
      override fun onTransformationCompleted(
        inputMediaItem: MediaItem,
        transformationResult: TransformationResult
      ) {
        super.onTransformationCompleted(inputMediaItem, transformationResult)
        promise.resolve(file.absolutePath)
      }

      override fun onTransformationError(
        inputMediaItem: MediaItem,
        exception: TransformationException
      ) {
        super.onTransformationError(inputMediaItem, exception)
        promise.reject(exception)
      }
    })

    transformer.startTransformation(inputMediaItem, file.absolutePath)
  }

  private object ExcludingEncoderSelector : EncoderSelector {

    private val EXCLUDED_ENCODERS = arrayListOf("OMX.qcom.video.encoder.avc")

    override fun selectEncoderInfos(mimeType: String): ImmutableList<MediaCodecInfo> =
      ImmutableList.copyOf(
        EncoderSelector.DEFAULT
          .selectEncoderInfos(mimeType)
          .filter { !EXCLUDED_ENCODERS.contains(it.name) }
      )

  }
}