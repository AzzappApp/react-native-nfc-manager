package com.azzapp.media

import android.net.Uri
import androidx.media3.common.util.UnstableApi
import androidx.media3.database.StandaloneDatabaseProvider
import com.azzapp.MainApplication
import com.facebook.react.bridge.Promise
import androidx.media3.datasource.DataSpec
import androidx.media3.datasource.DataSpec.HTTP_METHOD_GET
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.cache.CacheWriter
import androidx.media3.datasource.cache.LeastRecentlyUsedCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.async
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.io.IOException

@UnstableApi object VideoCache {
  private val exoPlayerCacheSize: Long = 512 * 1024 * 1024

  private var cacheDataSource: CacheDataSource? = null

  private var prefetchTasks = mutableMapOf<String, VideoPrefetchTask>()

  private val tasksToRemove = mutableSetOf<String>()

  fun prefetch(uri: Uri, promise: Promise) {
    if (uri.scheme == "file") {
      promise.resolve(false)
      return
    }
    createPrefetchTaskFor(uri)
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
    if (task != null) {
      task.cancel()
      return
    }
  }

  private fun getCacheDataSource(): CacheDataSource {
    var dataSource = cacheDataSource;
    val context = MainApplication.getMainApplicationContext()
    if (dataSource == null) {
      val databaseProvider = StandaloneDatabaseProvider(context)
      val httpDataSourceFactory = DefaultHttpDataSource.Factory()
        .setAllowCrossProtocolRedirects(true)

      val defaultDataSourceFactory = DefaultDataSource.Factory(
        context, httpDataSourceFactory
      )

      val simpleCache = SimpleCache(
        MainApplication.getMainApplicationContext().cacheDir,
        LeastRecentlyUsedCacheEvictor(exoPlayerCacheSize),
        databaseProvider
      )
      dataSource = CacheDataSource.Factory()
        .setCache(simpleCache)
        .setUpstreamDataSourceFactory(httpDataSourceFactory)
        .createDataSource()

      cacheDataSource = dataSource
    }
    return dataSource
  }

  private fun createPrefetchTaskFor(uri: Uri): VideoPrefetchTask? {
    val uriStr = uri.toString()
    var task = prefetchTasks[uriStr]
    if (task === null) {
      tasksToRemove.remove(uriStr)
      if (uri.scheme === "file") {
        return null;
      }
      val dataSpec = DataSpec(uri)
      task = VideoPrefetchTask(
        getCacheDataSource(),
        dataSpec
      ) {
        tasksToRemove.add(uriStr);
        scheduleClean()
      }
      prefetchTasks[uriStr] = task
    }
    return task
  }

  private var cleaningJob: Deferred<Any>? = null
  private fun scheduleClean() {
    cleaningJob?.cancel()
    cleaningJob = GlobalScope.async {
      delay(500L)
      tasksToRemove.forEach { prefetchTasks.remove(it) }
    }
  }

  private class VideoPrefetchTask(
    dataSource: CacheDataSource,
    dataSpec: DataSpec,
    onComplete: () -> Unit
  ) : PrefetchTask(onComplete) {
    private var status = "pending"
    private var error: Exception? = null
    private var promises = mutableListOf<Promise>()

    private var mCacheWriter: CacheWriter? = null
    init {
      GlobalScope.launch(Dispatchers.IO) {
        val cacheWriter = CacheWriter(
          dataSource,
          dataSpec,
          null,
          null,
        )
        try {

          mCacheWriter = cacheWriter
          cacheWriter.cache()
        } catch (e: Exception) {
          status = "failed"
          error = e;
          promises.forEach { promise -> promise.reject(e) }
        }
        if (error === null) {
          status = "resolved"
          promises.forEach { promise -> promise.resolve(null) }
        }
        clean()
      }
    }

    fun cancel() {
      mCacheWriter?.cancel()
    }
  }
}