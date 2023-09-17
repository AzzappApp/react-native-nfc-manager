package com.azzapp.gl

import android.content.Context
import android.graphics.SurfaceTexture
import android.media.effect.EffectContext
import android.opengl.GLES20
import android.opengl.GLSurfaceView
import android.os.Handler
import android.os.Looper
import android.view.Surface
import com.facebook.react.bridge.ReadableMap
import com.google.android.exoplayer2.DefaultRenderersFactory
import com.google.android.exoplayer2.ExoPlayer
import com.google.android.exoplayer2.MediaItem
import com.google.android.exoplayer2.Player
import com.google.android.exoplayer2.video.VideoSize
import java.util.concurrent.atomic.AtomicBoolean
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10
import kotlin.math.round


class GLVideoView(context: Context) :
  GLSurfaceView(context),
  GLSurfaceView.Renderer,
  Player.Listener {

  private var uri: String? = null
  private var videoSizeChanged: Boolean = false
  private var videoSize: VideoSize? = null
  private var player: ExoPlayer? = null
  private var parameters: ReadableMap? = null
  private var filters: ArrayList<String>? = null
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
    setEGLContextClientVersion(2)
    setEGLConfigChooser(8, 8, 8, 8, 0, 0)
    setRenderer(this)
    preserveEGLContextOnPause = true
    renderMode = RENDERMODE_WHEN_DIRTY
  }

  fun setUri(value: String?) {
    if (uri == value) {
      return
    }
    uri = value
    videoSize = null

    if (uri == null) {
      releasePlayer()
      return
    }

    if (player == null) {
      initPlayer()
    }

    val player = this.player ?: return

    if (player.mediaItemCount != 0) {
      player.stop()
      player.removeMediaItem(0)
    }
    val mediaItem = MediaItem.fromUri(uri!!)
    player.addMediaItem(mediaItem)
    player.prepare()

    if (surface != null) {
      player.setVideoSurface(surface)
      player.play()
    }
  }

  fun setParameters(parameters: ReadableMap?) {
    this.parameters = parameters
  }

  fun setFilters(value: ArrayList<String>?) {
    this.filters = value
  }

  override fun onSurfaceCreated(gl: GL10?, config: EGLConfig?) {
    externalTexture = ShaderUtils.createTexture()
    ShaderUtils.bindExternalTexture(externalTexture!!)

    val surfaceTexture = SurfaceTexture(externalTexture!!)
    surfaceTexture.setOnFrameAvailableListener {
      frameAvailable.set(true)
      requestRender()
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

      if (parameters != null) {
        if (effectContext == null) {
          effectContext = EffectContext.createWithCurrentGlContext()
        }

        this.transformedImage?.release()
        this.transformedImage = null


        this.transformedImage = AZPTransformations.applyEditorTransform(
          image,
          parameters,
          effectContext!!.factory
        )
        image = this.transformedImage ?: image
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

  fun pause() {
    player?.pause()
  }

  fun resume() {
    player?.play()
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
  }

  private fun initPlayer() {
    val player = ExoPlayer.Builder(context)
      .setRenderersFactory(
        // see https://github.com/google/ExoPlayer/issues/6168
        DefaultRenderersFactory(context).setEnableDecoderFallback(true)
      ).build()
    player.repeatMode = Player.REPEAT_MODE_ONE
    player.volume = 0f
    player.addListener(this)
    this.player = player
  }

  private fun releasePlayer() {
    this.player?.release()
    this.player = null
  }

  override fun onVideoSizeChanged(videoSize: VideoSize) {
    if (videoSize.width > 0 && videoSize.height > 0) {
      this.videoSize = videoSize
      videoSizeChanged = true
    }
  }

  private fun releaseSurface(oldSurfaceTexture: SurfaceTexture?, oldSurface: Surface?) {
    oldSurfaceTexture?.release()
    oldSurface?.release()
  }
}
