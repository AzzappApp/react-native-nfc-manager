package com.azzapp.gpu

import android.graphics.SurfaceTexture
import android.media.effect.EffectContext
import android.opengl.GLES20
import android.opengl.GLSurfaceView
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.Surface
import android.widget.FrameLayout
import com.azzapp.media.MediaVideoRendererManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.VideoSize
import androidx.media3.common.util.UnstableApi
import java.util.concurrent.atomic.AtomicBoolean
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10
import kotlin.math.round


@UnstableApi class GPUVideoView(private val reactContext: ThemedReactContext) :
  FrameLayout(reactContext),
  LifecycleEventListener,
  GLSurfaceView.Renderer,
  Player.Listener {

  private val surfaceView = GLSurfaceView(context)
  private var layer: GPULayer? = null
  private var videoSizeChanged: Boolean = false
  private var videoSize: VideoSize? = null
  private var player: ExoPlayer? = null
  private var surfaceWidth = 0
  private var surfaceHeight = 0
  private val mainHandler = Handler(Looper.getMainLooper())
  private val frameAvailable = AtomicBoolean(false)
  private var surface: Surface? = null
  private var surfaceTexture: SurfaceTexture? = null
  private var externalTexture: Int? = null
  private val externalTextureTransformMatrix: FloatArray = FloatArray(16)
  private var frameBuffer: Int? = null
  private var externalTextureRenderer: TextureRenderer? = null
  private var image: GLFrame? = null
  private var transformedImage: GLFrame? = null
  private var textureRenderer: TextureRenderer? = null
  private var effectContext: EffectContext? = null

  init {
    addView(surfaceView)
    reactContext.addLifecycleEventListener(this)
    surfaceView.setEGLContextClientVersion(2)
    surfaceView.setEGLConfigChooser(8, 8, 8, 8, 0, 0)
    surfaceView.setRenderer(this)
    surfaceView. preserveEGLContextOnPause = true
    surfaceView.renderMode = GLSurfaceView.RENDERMODE_WHEN_DIRTY
  }

  private var _paused = false
  var paused: Boolean
    get() {
      return this._paused
    }
    set(value) {
      this._paused = value
      if (_paused) {
        player?.pause()
      } else {
        player?.play()
      }
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
      Log.w(TAG, "GPUVideoView does not support multiple layers on android")
    }
    val newLayer = layers?.last { it.source.kind === GPULayer.GPULayerKind.VIDEO }
    var oldUri = layer?.source?.uri
    layer = newLayer;
    if (oldUri == layer?.source?.uri) {
      return
    }
    this.initPlayer()
  }

  fun release() {
    mainHandler.post {
      player?.setVideoSurface(null)
      player?.release()
      if (surface != null) {
        releaseSurface(surfaceTexture, surface)
        surfaceTexture = null
        surface = null
      }
    }
    reactContext.removeLifecycleEventListener(this)
  }

  override fun onHostResume() {
    if (!paused) {
      player?.play()
    }
  }

  override fun onHostPause() {
    player?.pause()
  }

  override fun onHostDestroy() {
    release()
  }

  override fun onSurfaceCreated(gl: GL10?, config: EGLConfig?) {
    externalTexture = ShaderUtils.createTexture()
    ShaderUtils.bindExternalTexture(externalTexture!!)

    val surfaceTexture = SurfaceTexture(externalTexture!!)
    surfaceTexture.setOnFrameAvailableListener {
      frameAvailable.set(true)
      surfaceView.requestRender()
    }

    if (image == null) {
      image = GLFrame.create()
    }

    mainHandler.post {
      val oldSurfaceTexture = this.surfaceTexture
      val oldSurface = surface
      this.surfaceTexture = surfaceTexture
      surface = Surface(surfaceTexture)
      releaseSurface(oldSurfaceTexture, oldSurface)
      player?.setVideoSurface(surface)
      player?.play()
    }
  }

  override fun onSurfaceChanged(gl: GL10?, width: Int, height: Int) {
    surfaceWidth = width
    surfaceHeight = height
  }

  override fun onDrawFrame(gl: GL10?) {
    GLES20.glClearColor(0.0f, 0.0f, 0.0f, 1.0f)
    GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT)

    var image = this.image ?: return
    val videoSize = this.videoSize ?: return

    if (frameAvailable.compareAndSet(true, false)) {
      surfaceTexture?.updateTexImage()
      surfaceTexture?.getTransformMatrix(externalTextureTransformMatrix)

      if (frameBuffer == null) {
        frameBuffer = ShaderUtils.createFrameBuffer()
      }

      if (videoSizeChanged) {
        ShaderUtils.bindRGBATexture(image.texture, videoSize.width, videoSize.height)
        image.width = videoSize.width
        image.height = videoSize.height
        videoSizeChanged = false
      }

      GLES20.glBindFramebuffer(GLES20.GL_FRAMEBUFFER, frameBuffer!!)
      GLES20.glFramebufferTexture2D(
        GLES20.GL_FRAMEBUFFER,
        GLES20.GL_COLOR_ATTACHMENT0,
        GLES20.GL_TEXTURE_2D,
        image.texture,
        0
      )

      if (externalTextureRenderer == null) {
        externalTextureRenderer = TextureRenderer(external = true, flipTexY = true)
      }

      GLES20.glClearColor(0.0f, 0.0f, 0.0f, 0.0f)
      GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT)
      externalTextureRenderer?.renderTexture(
        externalTexture!!,
        externalTextureTransformMatrix,
        0,
        0,
        videoSize.width,
        videoSize.height,
        frameBuffer!!
      )

      val parameters = layer?.parameters
      if (parameters != null) {
        if (effectContext == null) {
          effectContext = EffectContext.createWithCurrentGlContext()
        }

        this.transformedImage?.release()
        this.transformedImage = null


        this.transformedImage = GLFrameTransformations.applyEditorTransform(
          image,
          parameters,
          effectContext!!.factory
        )
        image = this.transformedImage ?: image
      }

      val filters = layer?.filters
      if (filters != null) {
        for (filter in filters!!) {
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
    }

    if (textureRenderer == null) {
      textureRenderer = TextureRenderer(external = false, flipTexY = true)
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
  override fun onVideoSizeChanged(videoSize: VideoSize) {
    if (videoSize.width > 0 && videoSize.height > 0) {
      this.videoSize = videoSize
      videoSizeChanged = true
    }
  }

  private var lastPlayerPosition = 0L
  private val updateProgressAction = Runnable { dispatchProgress() }
  private val handler = Handler(context.mainLooper)
  private fun dispatchProgress() {
    val player = this.player
    if (player === null) {
      return
    }
    val currentPosition = player.currentPosition
    if (lastPlayerPosition !== currentPosition) {
      lastPlayerPosition = currentPosition;
      val eventListener = (context as ReactContext).getJSModule(RCTEventEmitter::class.java)
      val event = Arguments.createMap()
      event.putDouble("currentTime", currentPosition / 1000.0)
      eventListener.receiveEvent(
        this.id,
        MediaVideoRendererManager.ON_PROGRESS,
        event
      )
    }
    handler.postDelayed(updateProgressAction, 200)
  }

  override fun onPlaybackStateChanged(playbackState: Int) {
    val eventListener = (context as ReactContext).getJSModule(RCTEventEmitter::class.java)
    if (playbackState == Player.STATE_READY) {
      eventListener.receiveEvent(
        this.id,
        GPUVideoViewManager.ON_PLAYER_READY,
        null
      )
      handler.post(updateProgressAction)
    } else  if (playbackState == Player.STATE_BUFFERING) {
      eventListener.receiveEvent(
        this.id,
        GPUVideoViewManager.ON_PLAYER_START_BUFFERING,
        null
      )
    }
  }

  override fun onPlayerError(error: PlaybackException) {
    val eventListener = (context as ReactContext).getJSModule(RCTEventEmitter::class.java)
    eventListener.receiveEvent(
      this.id,
      GPUVideoViewManager.ON_ERROR,
      null
    )
  }

  private fun initPlayer() {
    val uri = layer?.source?.uri
    if (uri == null) {
      releasePlayer()
      return
    }

    var player = this.player
    if (player == null) {
      player = ExoPlayer.Builder(context)
        .setRenderersFactory(
          // see https://github.com/google/ExoPlayer/issues/6168
          DefaultRenderersFactory(context).setEnableDecoderFallback(true)
        ).build()
      player.repeatMode = Player.REPEAT_MODE_ONE
      player.volume = 0f
      player.addListener(this)
      this.player = player
    }

    if (player.mediaItemCount != 0) {
      player.stop()
      player.removeMediaItem(0)
    }
    val mediaItem = MediaItem.fromUri(uri)
    player.addMediaItem(mediaItem)
    player.prepare()

    if (surface != null) {
      player.setVideoSurface(surface)
      player.play()
    }
  }

  private fun releasePlayer() {
    this.player?.release()
    this.player = null
  }

  private fun releaseSurface(oldSurfaceTexture: SurfaceTexture?, oldSurface: Surface?) {
    oldSurfaceTexture?.release()
    oldSurface?.release()
  }

  companion object {
    private const val TAG = "GPUVideoView"
  }
}
