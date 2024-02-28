package com.azzapp.gpu

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import android.util.Log
import com.azzapp.MainApplication
import com.bumptech.glide.Glide
import expo.modules.image.NoopDownsampleStrategy
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.async
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.io.File
import java.lang.ref.WeakReference
import java.net.URL
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

object GPULayerImageLoader {

  private class CacheEntry(
    deferred: Deferred<Bitmap?>
  ) {
    var bitmapRef: WeakReference<Bitmap>? = null
    var mDeferred: Deferred<Bitmap?>? = deferred
    var errored = false

    init {
      try {
        GlobalScope.launch {
          val bitmap = deferred.await()
          if (bitmap === null) {
            throw Exception("error")
          }
          bitmapRef = WeakReference(bitmap)
          mDeferred = null
        }
      } catch(e: Exception) {
        this.errored = true
        this.mDeferred = null
        this.bitmapRef = null
      }
    }
  }

  private val cache = mutableMapOf<String, CacheEntry>()

  suspend fun loadGPULayerSource(source: GPULayer.GPULayerSource) =
    when(source.kind) {
      GPULayer.GPULayerKind.IMAGE -> loadImage(source.uri)
      else -> {
        if (source.kind == GPULayer.GPULayerKind.VIDEO) {
          Log.w("GPULayerLoader", "Unsupported Video layer passed to GPUImageView treating it as VideoFrame")
        }
        loadVideoFrame(source.uri, source.startTime?.toLong() ?: 0L)
      }
    }

  public suspend fun loadImage(uri: Uri) =
    loadImageWithCache(uri.toString()) {
      getBitmapFromImage(uri)
    }

  private suspend fun loadVideoFrame(uri: Uri, time: Long) =
    loadImageWithCache("${uri.toString()}-${time.toString()}") {
      getBitmapFromVideoFrame(uri, time * 1000 * 1000)
    }

  private suspend fun loadImageWithCache(
    key: String,
    getBitmap: suspend () -> Bitmap?
  ) = withContext(Dispatchers.Default) {
    var entry = cache[key];
    var bitmap: Bitmap?
    var deferred: Deferred<Bitmap?>?  = null
    if (entry != null) {
      var ref = entry.bitmapRef;
      if (ref != null) {
        bitmap = ref.get()
        if (bitmap != null) {
          return@withContext bitmap
        }
      }
      deferred = entry.mDeferred
    }

    if (deferred == null) {
      deferred = async { getBitmap() }
      cache[key] = CacheEntry(deferred)
    }

    try {
      bitmap = deferred.await()
      if (bitmap == null) {
        throw Exception("Could not retrieve bitmap")
      }
      bitmap!!
    } catch (e: Exception) {
      cache.remove(key)
      throw e;
    }
  }

  private suspend fun getBitmapFromImage(uri: Uri)  =
    withContext(Dispatchers.IO) {
      val uriToLoad =
        if (uri.scheme != null) uri
        else MainApplication.getMainApplicationContext().resources
          .getIdentifier(
            uri.toString(),
            "drawable",
            MainApplication.getMainApplicationContext().packageName
          )

      Glide.with(MainApplication.getMainApplicationContext())
        .asBitmap()
        .load(uriToLoad)
        .submit()
        .get()
    }

  private suspend fun getBitmapFromVideoFrame(
    uri: Uri,
    time: Long,
  ) = withContext(Dispatchers.IO) {
      val retriever = MediaMetadataRetriever()

      if(uri.scheme == "file" || Build.VERSION.SDK_INT < 14) {
        retriever.setDataSource(MainApplication.getMainApplicationContext(), uri)
      } else {
        retriever.setDataSource(uri.toString(), HashMap<String, String>())
      }
      val image =
        retriever.getFrameAtTime(time)
      retriever.release()
      image
    }

  private const val TAG = "GPULayerImageLoad"
}