package com.azzapp.media


import android.net.Uri
import android.os.Handler
import android.util.LruCache
import android.view.SurfaceView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import java.io.File


@UnstableApi class MediaVideoRenderer(private val reactContext: ThemedReactContext) :
  SurfaceView(reactContext),
  LifecycleEventListener,
  Player.Listener {

  private var player: ExoPlayer? = null
  private var paused = false
  private var muted = false
  private var mSource: MediaVideoSource? = null
  private var seeking = false


  init {
    reactContext.addLifecycleEventListener(this)
  }

  fun setSource(source: ReadableMap?) {
    var newSource: MediaVideoSource? = null;
    if (source != null) {
      val mediaId = source.getString("mediaId")
      val uri = source.getString("uri")
      if (mediaId != null && uri != null) {
        newSource = MediaVideoSource(mediaId, uri)
      }
    }
    if (newSource == mSource) {
      return
    }
    mSource = newSource
    loadSource()
  }

  fun setMuted(value: Boolean?) {
    this.muted = value ?: false
    val player = this.player
    if (player !== null) {
      player.volume = if (this.muted) 0f else 1f
    }
  }

  fun setPaused(value: Boolean?) {
    this.paused = value ?: false
    val player = this.player
    if (player !== null) {
      if (this.paused && player.isPlaying) {
        player.pause()
      } else if (!this.paused && !player.isPlaying) {
        player.play()
      }
    }
  }

  fun setCurrentTime(currentTime: Int?) {
    if (currentTime != null) {
      seeking = true;
      this.player?.seekTo(currentTime * 1000L)
    }
  }

  fun release() {
    releasePlayer()
    reactContext.removeLifecycleEventListener(this)
  }


  private fun loadSource() {
    val source = mSource
    seeking = false
    if (source == null) {
      releasePlayer()
      return
    }
    if (player == null) {
      initializePlayer()
    }
    val player = this.player!!
    if (player.mediaItemCount != 0) {
      player.stop();
      player.clearMediaItems()
    }

    var uri = try { Uri.parse(source.uri) } catch(e: NullPointerException) { return }
    val localURI = uriCache[source.mediaId]
    if (localURI != null) {
      if (File(localURI).exists()) {
        uri = Uri.parse(localURI)
      } else {
        uriCache.remove(source.mediaId)
      }
    }
    val mediaItem = MediaItem.fromUri(uri)
    player.addMediaItem(mediaItem)
    player.prepare()
    val eventListener = (context as ReactContext).getJSModule(RCTEventEmitter::class.java)
    eventListener.receiveEvent(
      this.id,
      MediaVideoRendererManager.ON_LOADING_START,
      null
    )
    if (!paused) {
      player.play()
    }
  }

  private fun initializePlayer() {
    val player = ExoPlayer.Builder(context)
      .setRenderersFactory(
        // see https://github.com/google/ExoPlayer/issues/6168
        DefaultRenderersFactory(context).setEnableDecoderFallback(true)
      ).build()
    player.setVideoSurfaceView(this)
    player.repeatMode = Player.REPEAT_MODE_ONE
    player.volume = if (muted) 0f else 1f
    player.addListener(this)
    this.player = player
  }

  private fun releasePlayer() {
    player?.stop()
    player?.setVideoSurfaceView(null)
    player?.removeListener(this)
    player?.release()
    player = null
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
    player?.pause()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    if (!paused) {
      player?.play()
    }
  }

  override fun onPlaybackStateChanged(playbackState: Int) {
    if (playbackState == Player.STATE_READY) {
      val eventListener = (context as ReactContext).getJSModule(RCTEventEmitter::class.java)
      eventListener.receiveEvent(
        this.id,
        if (seeking) MediaVideoRendererManager.ON_SEEK_COMPLETE else MediaVideoRendererManager.ON_READY_FOR_DISPLAY,
        null
      )
      seeking = false
      handler.post(updateProgressAction)
    }
  }

  override fun onPlayerError(error: PlaybackException) {
    val eventListener = (context as ReactContext).getJSModule(RCTEventEmitter::class.java)
    eventListener.receiveEvent(
      this.id,
      MediaVideoRendererManager.ON_ERROR,
      null
    )
  }

  override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
    if (reason === Player.MEDIA_ITEM_TRANSITION_REASON_REPEAT) {
      val eventListener = (context as ReactContext).getJSModule(RCTEventEmitter::class.java)
      eventListener.receiveEvent(
        this.id,
        MediaVideoRendererManager.ON_END,
        null
      )
    }
  }

  private inner class MediaVideoSource(
    val mediaId: String,
    val uri: String,
  ) {
    override fun equals(other: Any?): Boolean {
      return other === this ||
          (other is MediaVideoSource &&
              other.uri == uri &&
              other.mediaId == mediaId)
    }
  }

  companion object {

    private val uriCache = LruCache<String, String>(100)

    fun addLocalCachedFile(mediaId: String, value: String) {
      uriCache.put(mediaId, value)
    }
  }
}
