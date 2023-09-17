package com.azzapp


import android.view.SurfaceView
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.google.android.exoplayer2.*


class AZPMediaVideoRenderer(private val reactContext: ThemedReactContext) :
  SurfaceView(reactContext),
  LifecycleEventListener,
  Player.Listener {

  private var player: ExoPlayer? = null
  private var paused = false
  private var muted = false
  private var uri: String? = null
  private var seeking = false

  init {
    reactContext.addLifecycleEventListener(this)
  }

  fun setURI(value: String?) {
    if (uri == value) {
      return
    }
    uri = value
    seeking = false
    if (uri == null) {
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
    val mediaItem = MediaItem.fromUri(uri!!)
    player.addMediaItem(mediaItem)
    player.prepare()
    if (!paused) {
      player.play()
    }
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
        if (seeking) AZPMediaVideoRendererManager.ON_SEEK_COMPLETE else AZPMediaVideoRendererManager.ON_READY_FOR_DISPLAY,
        null
      )
      seeking = false
    }
  }

  override fun onPlayerError(error: PlaybackException) {
    val eventListener = (context as ReactContext).getJSModule(RCTEventEmitter::class.java)
    eventListener.receiveEvent(
      this.id,
      AZPMediaVideoRendererManager.ON_ERROR,
      null
    )
  }

  override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
    if (reason === Player.MEDIA_ITEM_TRANSITION_REASON_REPEAT) {
      val eventListener = (context as ReactContext).getJSModule(RCTEventEmitter::class.java)
      eventListener.receiveEvent(
        this.id,
        AZPMediaVideoRendererManager.ON_END,
        null
      )
    }
  }
}
