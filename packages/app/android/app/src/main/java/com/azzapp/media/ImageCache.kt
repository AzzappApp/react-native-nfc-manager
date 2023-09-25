package com.azzapp.media

import android.graphics.drawable.Drawable
import android.net.Uri
import com.azzapp.MainApplication
import com.bumptech.glide.Glide
import com.bumptech.glide.load.DataSource
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.load.engine.GlideException
import com.bumptech.glide.request.RequestListener
import com.bumptech.glide.request.target.Target
import com.facebook.react.bridge.Promise
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.async
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

object ImageCache {

  private val prefetchTasks = mutableMapOf<String, ImagePrefetchTask>()

  private val tasksToRemove = mutableSetOf<String>()

  fun prefetch(uri: Uri, promise: Promise) {
    val context = MainApplication.getMainApplicationContext()
    if (context == null) {
      promise.reject("PREFETCH_WITHOUT_CONTEXT", "The MainApplication is not initialized")
      return
    }
    val id = uri.toString()
    if (prefetchTasks[id] != null) {
      promise.resolve(true)
      return
    }
    tasksToRemove.remove(id)
    val task = ImagePrefetchTask() {
      tasksToRemove.add(id)
      scheduleClean()
    }
    val target = Glide.with(context)
      .load(uri)
      .listener(object : RequestListener<Drawable> {
        override fun onResourceReady(
          resource: Drawable?,
          model: Any?,
          target: Target<Drawable>?,
          dataSource: DataSource?,
          isFirstResource: Boolean
        ): Boolean {
          task.onLoadSuccess()
          return false
        }

        override fun onLoadFailed(
          e: GlideException?,
          model: Any?,
          target: Target<Drawable>?,
          isFirstResource: Boolean
        ): Boolean {

          task.onLoadFailed(e)
          return false
        }
      })
      .skipMemoryCache(true)
      .diskCacheStrategy(DiskCacheStrategy.ALL)
      .preload()
    task.target = target

    prefetchTasks[id] = task

    promise.resolve(true)
  }

  fun observePrefetchResult(uri: Uri, promise: Promise) {
    val task = prefetchTasks[uri.toString()]
    if (task == null) {
      promise.reject("TASK_DOES_NOT_EXISTS", "No task registered for url $uri")
      return
    }
    task.addPromise(promise)
  }

  fun cancelPrefetch(uri: Uri) {
    val task = prefetchTasks[uri.toString()]
    val context = MainApplication.getMainApplicationContext()
    if (context == null || task === null || task.target == null) {
      return
    }
    Glide.with(context).clear(task.target)
    task.clean()
  }

  private var cleaningJob: Deferred<Any>? = null
  private fun scheduleClean() {
    cleaningJob?.cancel()
    cleaningJob = GlobalScope.async {
      delay(500L)
      tasksToRemove.forEach { prefetchTasks.remove(it) }
    }
  }

  private class ImagePrefetchTask(onComplete: () ->Unit ): PrefetchTask(onComplete) {
    var target: Target<Drawable>? = null
  }
}