package com.azzapp.gpu

import android.content.Context
import android.graphics.Bitmap
import android.graphics.SurfaceTexture
import android.media.effect.EffectContext
import android.media.effect.EffectFactory
import android.opengl.EGL14
import android.opengl.EGLExt
import android.opengl.GLES20
import android.view.Surface
import androidx.media3.common.ColorInfo
import androidx.media3.common.DebugViewProvider
import androidx.media3.common.Effect
import androidx.media3.common.FrameInfo
import androidx.media3.common.OnInputFrameProcessedListener
import androidx.media3.common.SurfaceInfo
import androidx.media3.common.VideoFrameProcessingException
import androidx.media3.common.VideoFrameProcessor
import androidx.media3.common.util.GlUtil
import androidx.media3.common.util.UnstableApi
import kotlinx.coroutines.ExecutorCoroutineDispatcher
import kotlinx.coroutines.asCoroutineDispatcher
import kotlinx.coroutines.runBlocking
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.ExecutionException
import java.util.concurrent.Executor
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger
import kotlin.math.round
import javax.microedition.khronos.egl.*

@UnstableApi class GLExoPlayerFrameProcessor(
        private val outputWidth: Int,
        private val outputHeight: Int,
        private val egl: EGL10,
        private val eglContext: EGLContext,
        private val eglDisplay: EGLDisplay,
        private val eglConfig: EGLConfig,
        private val listener: VideoFrameProcessor.Listener,
        private val coroutineDispatcher: ExecutorCoroutineDispatcher,
        private val parameters: GPULayer.EditionParameters?,
        private val filters: ArrayList<String>?
) : VideoFrameProcessor {

  private var pendingFrames = ConcurrentLinkedQueue<FrameInfo>()
  private var availableFrameCount = AtomicInteger()
  private var nextInputFrameInfo: FrameInfo? = null
  private val drawing = AtomicBoolean(false)
  private var inputStreamEnded = AtomicBoolean(false)

  private var outputSurfaceInfo: SurfaceInfo? = null
  private var outputSizeConfigured = false

  //private var outputSizeOrRotationChanged = false
  private var outputEglSurface: EGLSurface? = null

  private val externalTexture: Int = ShaderUtils.createTexture()
  private val surfaceTexture: SurfaceTexture
  private var inputSurface: Surface

  private var effectContext: EffectContext? = null

  private var frameBuffer: Int
  private var image: GLFrame
  private var externalTextureRenderer: TextureRenderer
  private val externalTextureTransformMatrix: FloatArray = FloatArray(16)


  private var textureRenderer: TextureRenderer


  init {
    ShaderUtils.bindExternalTexture(externalTexture)
    surfaceTexture = SurfaceTexture(externalTexture)
    surfaceTexture.setOnFrameAvailableListener {
      availableFrameCount.getAndIncrement()
      maybeQueueFrame()
    }

    inputSurface = Surface(surfaceTexture)
    externalTextureRenderer = TextureRenderer(external = true, flipTexY = true)
    image = GLFrame.create()
    textureRenderer = TextureRenderer(external = false, flipTexY = true)

    frameBuffer = ShaderUtils.createFrameBuffer()

  }

  override fun queueInputBitmap(inputBitmap: Bitmap, durationUs: Long, frameRate: Float) {
  }

  override fun queueInputTexture(textureId: Int, presentationTimeUs: Long) {
  }

  override fun setOnInputFrameProcessedListener(listener: OnInputFrameProcessedListener) {
  }


  override fun getInputSurface(): Surface = inputSurface

  override fun registerInputStream(inputType: Int) {

  }

  override fun setInputFrameInfo(inputFrameInfo: FrameInfo) {
    nextInputFrameInfo = inputFrameInfo
  }

  override fun registerInputFrame() {
    pendingFrames.add(nextInputFrameInfo)
  }

  override fun getPendingInputFrameCount(): Int {
    return pendingFrames.size
  }

  override fun setOutputSurfaceInfo(value: SurfaceInfo?) {
    if (outputSurfaceInfo != value) {
      if (value?.surface != outputSurfaceInfo?.surface
      ) {
        outputEglSurface = null
      }
      /*outputSizeOrRotationChanged =
            value?.width != outputSurfaceInfo?.width ||
                value?.height != outputSurfaceInfo?.height ||
                value?.orientationDegrees != outputSurfaceInfo?.orientationDegrees*/
      outputSurfaceInfo = value
    }
  }

  override fun renderOutputFrame(releaseTimeNs: Long) {
    throw RuntimeException("GLExoPlayerFrameProcessor only support automatic frame releasing")
  }

  override fun signalEndOfInput() {
    inputStreamEnded.set(true)
    if (pendingFrames.isEmpty()) {
      listener.onEnded()
    }

  }

  override fun flush() {
  }

  override fun release() {
    runBlocking(coroutineDispatcher) {
      egl.eglDestroyContext(eglDisplay, eglContext)
    }
    coroutineDispatcher.close()
    surfaceTexture.release()
    inputSurface.release()
  }

  private fun maybeQueueFrame() {
    if (!outputSizeConfigured) {
      listener.onOutputSizeChanged(outputWidth, outputHeight)
      outputSizeConfigured = true
    }
    if (
      availableFrameCount.get() == 0 ||
      !drawing.compareAndSet(false, true) ||
      outputSurfaceInfo == null
    ) {
      return
    }
    val currentFrame = pendingFrames.remove() ?: return
    availableFrameCount.getAndDecrement()
    runBlocking(coroutineDispatcher) {
      surfaceTexture.updateTexImage()
      surfaceTexture.getTransformMatrix(externalTextureTransformMatrix)
      val frameTimeNs = surfaceTexture.timestamp
      val streamOffsetUs = currentFrame.offsetToAddUs

      var retryCount = 0;
      while(true) {
        try {
          drawFrame(
            currentFrame.width,
            currentFrame.height,
          )
        } catch (e: Exception) {
          if (retryCount < 2) {
            retryCount++
            continue
          }
          listener.onError(VideoFrameProcessingException.from(e))
        }
        break;
      }

      EGLExt.eglPresentationTimeANDROID(
        EGL14.eglGetCurrentDisplay(),
        EGL14.eglGetCurrentSurface(EGL14.EGL_DRAW),
        frameTimeNs
      )

      egl.eglSwapBuffers(eglDisplay, outputEglSurface)

      listener.onOutputFrameAvailableForRendering(frameTimeNs / 1000 - streamOffsetUs)
      drawing.set(false)
      if (inputStreamEnded.get() && pendingFrames.isEmpty()) {
        listener.onEnded()
      }
      maybeQueueFrame()

    }
  }

  private fun drawFrame(width: Int, height: Int) {
    val surfaceInfo = outputSurfaceInfo ?: return
    var eglSurface = outputEglSurface
    if (eglSurface == null) {
      eglSurface = egl.eglCreateWindowSurface(
        eglDisplay,
        eglConfig,
        surfaceInfo.surface,
        intArrayOf(EGL10.EGL_NONE),
      )
      outputEglSurface = eglSurface
    }

    egl.eglMakeCurrent(eglDisplay, eglSurface, eglSurface, eglContext)
    if (width != image.width || height != image.height) {
      ShaderUtils.bindRGBATexture(image.texture, width, height)
      image.width = width
      image.height = height
    }

    GLES20.glBindFramebuffer(GLES20.GL_FRAMEBUFFER, frameBuffer)
    GLES20.glFramebufferTexture2D(
      GLES20.GL_FRAMEBUFFER,
      GLES20.GL_COLOR_ATTACHMENT0,
      GLES20.GL_TEXTURE_2D,
      image.texture,
      0
    )

    GLES20.glClearColor(0.0f, 0.0f, 0.0f, 0.0f)
    GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT)
    externalTextureRenderer.renderTexture(
      externalTexture,
      externalTextureTransformMatrix,
      0,
      0,
      width,
      height,
      frameBuffer
    )

    if (effectContext == null) {
      effectContext = EffectContext.createWithCurrentGlContext()
    }

    var outputImage = image
    if (surfaceInfo.orientationDegrees != 0) {
      outputImage = GLFrameTransformations.applyEffect(
        image,
        null,
        EffectFactory.EFFECT_ROTATE,
        mapOf("angle" to -surfaceInfo.orientationDegrees),
        effectContext!!.factory
      )
    }

    if (parameters != null) {
      val croppedImage = GLFrameTransformations.applyEditorTransform(
        outputImage,
        parameters,
        effectContext!!.factory
      ) ?: image
      if (outputImage !== image) {
        outputImage.release()
      }
      outputImage = croppedImage
    }

    if (filters != null) {
      for (filter in filters) {
        val transform = GLFrameTransformations.transformationForName(filter)
        if (transform != null) {
          val transformedImage = transform(
            outputImage,
            null,
            null,
            effectContext!!.factory
          )
          if (outputImage !== image) {
            outputImage.release()
          }
          outputImage = transformedImage
        }
      }
    }

    textureRenderer.renderTexture(
      outputImage.texture,
      ShaderUtils.IDENT_MATRIX,
      round(image.x * surfaceInfo.width.toFloat() / image.width.toFloat()).toInt(),
      -round(image.y * surfaceInfo.height.toFloat() / image.height.toFloat()).toInt(),
      surfaceInfo.width,
      surfaceInfo.height
    )
    if (outputImage !== image) {
      outputImage.release()
    }
  }


  class Factory(
    private val outputWidth: Int,
    private val outputHeight: Int,
    private val parameters: GPULayer.EditionParameters?,
    private val filters: ArrayList<String>?,
  ) : VideoFrameProcessor.Factory {

    override fun create(
      context: Context, 
      effects: MutableList<Effect>, 
      debugViewProvider: DebugViewProvider, 
      inputColorInfo: ColorInfo, 
      outputColorInfo: ColorInfo, 
      renderFramesAutomatically: Boolean,
      listenerExecutor: Executor,
      listener: VideoFrameProcessor.Listener): VideoFrameProcessor {
      
      if (!renderFramesAutomatically) {
        throw VideoFrameProcessingException(
                "GLExoPlayerFrameProcessor can't be used with releaseFramesAutomatically set to false"
        )
      }

      val coroutineDispatcher =
        Executors.newSingleThreadExecutor().asCoroutineDispatcher()

      try {
        val frameProcessor = runBlocking(coroutineDispatcher) {
          createOpenGLObjectsAndFrameProcessor(
            listener,
            coroutineDispatcher,
          )
        }
        return frameProcessor
      } catch (e: ExecutionException) {
        throw VideoFrameProcessingException(e)
      } catch (e: InterruptedException) {
        Thread.currentThread().interrupt()
        throw VideoFrameProcessingException(e)
      }
    }


    private fun createOpenGLObjectsAndFrameProcessor(
      listener: VideoFrameProcessor.Listener,
      coroutineDispatcher: ExecutorCoroutineDispatcher,
    ): VideoFrameProcessor {
      val egl = EGLContext.getEGL() as EGL10
      val eglDisplay = egl.eglGetDisplay(EGL10.EGL_DEFAULT_DISPLAY)

      val configs = arrayOfNulls<EGLConfig>(1)

      if (
        !egl.eglChooseConfig(
          eglDisplay,
          intArrayOf(
            EGL10.EGL_RENDERABLE_TYPE, EGL14.EGL_OPENGL_ES2_BIT,
            EGL10.EGL_RED_SIZE,  /* redSize= */ 8,
            EGL10.EGL_GREEN_SIZE,  /* greenSize= */ 8,
            EGL10.EGL_BLUE_SIZE,  /* blueSize= */ 8,
            EGL10.EGL_ALPHA_SIZE,  /* alphaSize= */ 8,
            EGL10.EGL_DEPTH_SIZE,  /* depthSize= */ 0,
            EGL10.EGL_STENCIL_SIZE,  /* stencilSize= */ 0,
            EGL10.EGL_NONE
          ),
          configs,
          1,
          IntArray(1)
        )
      ) {
        throw RuntimeException("could not find egl config")
      }

      val eglConfig = configs[0] ?: throw RuntimeException("could not find egl config")
      val eglContext = egl.eglCreateContext(
        eglDisplay,
        eglConfig,
        EGL10.EGL_NO_CONTEXT,
        intArrayOf(
          ShaderUtils.EGL_CONTEXT_CLIENT_VERSION,
          2,
          EGL10.EGL_NONE
        )
      )
      egl.eglMakeCurrent(eglDisplay, EGL10.EGL_NO_SURFACE, EGL10.EGL_NO_SURFACE, eglContext)
      return GLExoPlayerFrameProcessor(
        outputWidth,
        outputHeight,
        egl,
        eglContext,
        eglDisplay,
        eglConfig,
        listener,
        coroutineDispatcher,
        parameters,
        filters
      )
    }
  }
}