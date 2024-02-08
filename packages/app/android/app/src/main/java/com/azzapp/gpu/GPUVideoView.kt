package com.azzapp.gpu

import android.graphics.Bitmap
import android.media.effect.EffectContext
import android.opengl.GLES20
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.widget.FrameLayout
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.VideoSize
import androidx.media3.common.util.UnstableApi
import com.azzapp.gpu.effects.ColorLUTEffect
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.async
import kotlin.math.round


@UnstableApi class GPUVideoView(private val reactContext: ThemedReactContext) :
  FrameLayout(reactContext),
  LifecycleEventListener,
  Player.Listener {

  private val videoProcessor = GPUVideoViewVideoProcessor()
  private val surfaceView = VideoProcessingGLSurfaceView(context, false, videoProcessor)
  private var layer: GPULayer? = null
  private var player: ExoPlayer? = null
  private val mainHandler = Handler(Looper.getMainLooper())

  init {
    addView(surfaceView)
    reactContext.addLifecycleEventListener(this)
    surfaceView.preserveEGLContextOnPause = true
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
    var oldStartTime = layer?.source?.startTime
    var oldDuration = layer?.source?.duration

    val oldLutFilterUri = layer?.lutFilterUri
    layer = newLayer;
    videoProcessor.setLayer(newLayer)

    if (oldLutFilterUri != layer?.lutFilterUri) {
      loadLutBitmapIfNecessary()
    }

    if (oldUri == layer?.source?.uri &&  oldDuration == layer?.source?.duration && oldStartTime == layer?.source?.startTime) {
      return
    }

    this.initPlayer()
  }

  private fun initPlayer() {
    val uri = layer?.source?.uri
    if (uri == null) {
      this.player?.release()
      this.player = null
      surfaceView.setPlayer(null)
      return
    }

    var player = this.player
    if (player == null) {
      player = ExoPlayer.Builder(context).build()
      player.repeatMode = Player.REPEAT_MODE_ONE
      player.volume = 0f
      player.addListener(this)
      this.player = player
    }

    if (player.mediaItemCount != 0) {
      player.stop()
      player.removeMediaItem(0)
    }
    val mediaItemBuilder = MediaItem.Builder().setUri(uri)
    if(layer?.source?.startTime != null){
      val start = layer!!.source.startTime!!.toLong() * 1000L;
      mediaItemBuilder.setClippingConfiguration(
        MediaItem.ClippingConfiguration.Builder().setStartPositionMs(start).setEndPositionMs(start + layer!!.source.duration!!.toLong() * 1000L).build()
      )
    }

    player.addMediaItem(mediaItemBuilder.build())

    player.prepare()
    surfaceView.setPlayer(player)
  }


  override fun onVideoSizeChanged(videoSize: VideoSize) {
    if (videoSize.width > 0 && videoSize.height > 0) {
      videoProcessor.setVideoSize(videoSize)
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
      event.putDouble("duration", player.duration.toDouble() / 1000.0)
      eventListener.receiveEvent(
        this.id,
        GPUVideoViewManager.ON_PROGRESS,
        event
      )
    }
    handler.postDelayed(updateProgressAction, 50)
  }

  override fun onPlaybackStateChanged(playbackState: Int) {
    val eventListener = (context as ReactContext).getJSModule(RCTEventEmitter::class.java)
    Log.i(TAG, "Playback state $playbackState")
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


  private var loadLutJob: Deferred<Any>? = null
  private fun loadLutBitmapIfNecessary() {
    loadLutJob?.cancel()
    videoProcessor.setLutBitmap(null)
    val lutFilterUri = layer?.lutFilterUri;
    if (lutFilterUri != null) {
      loadLutJob = GlobalScope.async {
        val bitmap = GPULayerImageLoader.loadImage(lutFilterUri)
        videoProcessor.setLutBitmap(bitmap)
      }
    }
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

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    release()
  }

  fun release() {
    mainHandler.post {
      surfaceView.setPlayer(null)
      player?.release()
    }
    reactContext.removeLifecycleEventListener(this)
  }


  companion object {
    private const val TAG = "GPUVideoView"
  }

  private class GPUVideoViewVideoProcessor: VideoProcessingGLSurfaceView.VideoProcessor {
    private var surfaceWidth = 0
    private var surfaceHeight = 0

    private var videoSize: VideoSize? = null

    private var layer: GPULayer? = null

    private val frameBufferPool = FrameBufferPool()

    private var externalTextureRenderer: TextureRenderer? = null
    private var textureRenderer: TextureRenderer? = null

    private var effectContext: EffectContext? = null

    private var lutChanged = false
    private var lutBitmap: Bitmap? = null
    private var lutImage: GLFrame? = null
    private var colorLutEffect: ColorLUTEffect? = null;

    override fun initialize() {
      externalTextureRenderer = TextureRenderer(external = true, flipTexY = true)
      textureRenderer = TextureRenderer(external = false, flipTexY = true)
      colorLutEffect = ColorLUTEffect()
      effectContext = EffectContext.createWithCurrentGlContext()
    }

    fun setVideoSize(videoSize: VideoSize) {
      this.videoSize = videoSize
    }

    fun setLayer(layer: GPULayer?) {
      this.layer = layer
    }

    fun setLutBitmap(bitmap: Bitmap?) {
      if (bitmap == lutBitmap) {
        return
      }
      lutChanged = true
      lutBitmap = bitmap
    }

    override fun setSurfaceSize(width: Int, height: Int) {
      surfaceWidth = width
      surfaceHeight= height
    }

    override fun draw(frameTexture: Int, frameTimestampUs: Long, transformMatrix: FloatArray) {
      GLES20.glClearColor(0.0f, 0.0f, 0.0f, 1.0f)
      GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT)

      var image = GLFrame.create()
      val videoSize = this.videoSize ?: return

      ShaderUtils.bindRGBATexture(image.texture, videoSize.width, videoSize.height)
      image.width = videoSize.width
      image.height = videoSize.height

      val frameBuffer = frameBufferPool.getFrameBuffer()

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
      externalTextureRenderer?.renderTexture(
        frameTexture,
        transformMatrix,
        0,
        0,
        videoSize.width,
        videoSize.height,
        frameBuffer
      )

      frameBufferPool.releaseFrameBuffer(frameBuffer)


      fun setImage(newImage: GLFrame) {
        if (newImage === image) {
          return;
        }
        image.release()
        image = newImage
      }

      val parameters = layer?.parameters
      if (parameters != null) {
        val transformedImage = GLFrameTransformations.applyEditorTransform(
          image,
          parameters,
          effectContext!!.factory
        )
        setImage(transformedImage)
      }


      if (lutChanged) {
        lutImage?.release()
        lutImage = null
        lutChanged = false
      }

      val lutBitmap = lutBitmap
      var lutImage = lutImage
      if (lutBitmap != null && lutImage == null) {
        lutImage = GLFrame.create(lutBitmap.width, lutBitmap.height)
        ShaderUtils.bindImageTexture(lutImage.texture, lutBitmap)
        this.lutImage = lutImage
      }
      if (lutImage != null) {
        val imageWithLut = colorLutEffect?.draw(
          image,
          lutImage,
          frameBufferPool
        )
        setImage(imageWithLut ?: image)
      }

      textureRenderer?.renderTexture(
        image.texture,
        ShaderUtils.IDENT_MATRIX,
        round(image.x * surfaceWidth.toFloat() / image.width.toFloat()).toInt(),
        -round(image.y * surfaceHeight.toFloat() / image.height.toFloat()).toInt(),
        surfaceWidth,
        surfaceHeight
      )
      image.release()
    }

    override fun release() {
      frameBufferPool.release()
      effectContext?.release()
      externalTextureRenderer?.release()
      textureRenderer?.release()
      colorLutEffect?.release()
      lutImage?.release()
    }
  }
}