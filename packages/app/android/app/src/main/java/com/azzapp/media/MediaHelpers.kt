package com.azzapp.media

import android.graphics.Bitmap
import android.graphics.Color
import android.media.MediaMetadataRetriever
import android.net.Uri
import androidx.media3.common.util.UnstableApi
import com.facebook.react.bridge.*
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.Segmentation
import com.google.mlkit.vision.segmentation.selfie.SelfieSegmenterOptions
import java.io.File
import java.io.FileOutputStream
import java.util.UUID


@UnstableApi class MediaHelpers(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "AZPMediaHelpers"

  @ReactMethod
  fun getVideoSize(uri: String, promise: Promise) {
    val width: Int
    val height: Int
    val uri = try { Uri.parse(uri) } catch (e: NullPointerException) { null }
    if (uri == null) {
      promise.reject("INVALID_URI", "provided uri is invalid");
      return
    }
    try {
      val metaRetriever = MediaMetadataRetriever()
      metaRetriever.setDataSource(uri.path)
      val frame: Bitmap? = metaRetriever.frameAtTime
      if (frame == null) {
        promise.reject("failure", "Could not find video", null)
        return
      }
      width = frame.width
      height = frame.height
    } catch (e: Error) {
      promise.reject("failure", "Error while retrieving metadata", e)
      return;
    }
    val map = WritableNativeMap();
    map.putInt("width", width);
    map.putInt("height", height);
    promise.resolve(map)
  }



  @ReactMethod
  fun segmentImage(uri: String, promise: Promise) {

    val options =
        SelfieSegmenterOptions.Builder()
          .setDetectorMode(SelfieSegmenterOptions.SINGLE_IMAGE_MODE)
          .enableRawSizeMask()
          .build()
    val segmenter = Segmentation.getClient(options)
    val imagePath = try { Uri.parse(uri) } catch(e: NullPointerException) {
      promise.reject("INVALID_URI", "provided uri is invalid")
      return;
    }

    val inputImage =  InputImage.fromFilePath(reactContext, imagePath)
    val maskedImageFile = File(reactContext.cacheDir, UUID.randomUUID().toString() + ".png")
    segmenter.process(inputImage)
    .addOnSuccessListener { segmentationResult ->
      val mask = segmentationResult.buffer.asFloatBuffer()
      val maskWidth = segmentationResult.width
      val maskHeight = segmentationResult.height

      val maskBitmap = Bitmap.createBitmap(maskWidth, maskHeight, Bitmap.Config.ARGB_8888)
      for (y in 0 until maskHeight) {
          for (x in 0 until maskWidth) {
              val foregroundConfidence = mask.get().coerceIn(0.0f, 1.0f)
              //interpolate [0.2, 1]  to [ 0 ,255]
              val alpha = (((foregroundConfidence - 0.2f) / (1.0f - 0.2f)) * 255).toInt()
              if (foregroundConfidence <= 0.2){
                maskBitmap.setPixel(x, y, Color.BLACK)
              }
              else {
                maskBitmap.setPixel(x, y, Color.argb(alpha, 255, 255, 255))
              }
          }
      }



      val outputStream = FileOutputStream(maskedImageFile)
      maskBitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
      outputStream.flush()
      outputStream.close()
      promise.resolve(maskedImageFile.absolutePath)
    }
    .addOnFailureListener { e ->
        promise.reject("ERROR_SEGMENTATION", e.localizedMessage)
    }
  }

  @ReactMethod
  fun prefetchImage(uriStr: String, promise: Promise) {
    val uri = try { Uri.parse(uriStr) } catch(e: NullPointerException) {
      promise.reject("INVALID_URI", "provided uri is invalid")
      return;
    }
    ImageCache.prefetch(uri, promise)
  }

  @ReactMethod
  fun observeImagePrefetchResult(uriStr: String, promise: Promise) {
    val uri = try { Uri.parse(uriStr) } catch(e: NullPointerException) {
      promise.reject("INVALID_URI", "provided uri is invalid")
      return;
    }
    ImageCache.observePrefetchResult(uri, promise)
  }

  @ReactMethod
  fun cancelImagePrefetch(uriStr: String) {
    val uri = try { Uri.parse(uriStr) } catch(e: NullPointerException) { return }
    ImageCache.cancelPrefetch(uri)
  }

  @ReactMethod
  fun prefetchVideo(uriStr: String, promise: Promise) {
    val uri = try { Uri.parse(uriStr) } catch(e: NullPointerException) {
      promise.reject("INVALID_URI", "provided uri is invalid")
      return;
    }
    VideoCache.prefetch(uri, promise)
  }

  @ReactMethod
  fun observeVideoPrefetchResult(uriStr: String, promise: Promise) {
    val uri = try { Uri.parse(uriStr) } catch(e: NullPointerException) {
      promise.reject("INVALID_URI", "provided uri is invalid")
      return;
    }
    VideoCache.observePrefetchResult(uri, promise)
  }

  @ReactMethod
  fun cancelVideoPrefetch(uriStr: String) {
    val uri = try { Uri.parse(uriStr) } catch(e: NullPointerException) { return }
    VideoCache.cancelPrefetch(uri)
  }
}