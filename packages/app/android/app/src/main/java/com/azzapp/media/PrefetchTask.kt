package com.azzapp.media

import com.facebook.react.bridge.Promise
import java.lang.Exception

open class PrefetchTask(
  private val onComplete: (() -> Unit)?
) {
  private var status = "pending"
  private var error: Exception? = null
  private var promises = mutableListOf<Promise>()

  fun onLoadFailed(e: Exception?) {
    this.status = "failure"
    this.error = e
    promises.forEach { p -> p.reject(e) }
    clean()
  }

  fun onLoadSuccess() {
    this.status = "success"
    promises.forEach { p -> p.resolve(null) }
    clean()
  }

  fun addPromise(promise: Promise) {
    if (status == "failure") {
      promise.reject(error)
    } else if (status == "success") {
      promise.resolve(null)
    } else {
      promises.add(promise)
    }
  }

  fun clean() {
    promises.clear()
    onComplete?.invoke()
  }
}