package com.azzapp.media

import android.media.MediaMetadataRetriever
import android.net.Uri
import android.content.ContentResolver
import android.database.Cursor
import android.provider.MediaStore
import com.azzapp.MainApplication.Companion.getMainApplicationContext
import com.facebook.react.bridge.*


class MediaHelpers(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "AZPMediaHelpers"

  @ReactMethod
  fun getVideoSize(uri: String, promise: Promise) {
    var width: Int
    var height: Int
    val rotation: Int
    val uri = try {
      Uri.parse(uri)
    } catch (e: NullPointerException) {
      null
    }
    if (uri == null) {
      promise.reject("INVALID_URI", "provided uri is invalid");
      return
    }
    try {
      val retriever = MediaMetadataRetriever()
      if (uri.scheme == "file") {
        retriever.setDataSource(getMainApplicationContext(), uri)
      } else {
        retriever.setDataSource(uri.toString(), HashMap())
      }
      rotation = try {
        Integer.parseInt(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION) ?: "0")
      } catch (e: NumberFormatException) {
        0
      }
      width = try {
        Integer.parseInt(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH) ?: "0")
      } catch (e: NumberFormatException) {
        0
      }
      height = try {
        Integer.parseInt(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT) ?: "0")
      } catch (e: NumberFormatException) {
        0
      }
      if (rotation == 90 || rotation == 270) {
        val tempWidth = width;
        width = height;
        height = tempWidth;
      }
    } catch (e: Error) {
      promise.reject("failure", "Error while retrieving metadata", e)
      return;
    }
    val map = WritableNativeMap();
    map.putInt("width", width);
    map.putInt("height", height);
    map.putInt("rotation", rotation);
    promise.resolve(map)
  }


  @ReactMethod
  fun getFilePath(contentUri: String, promise: Promise) {
      try {
          val uri = Uri.parse(contentUri)
          if (uri.scheme == "content") {
              val filePath = getRealPathFromUri(uri)
              if (filePath != null) {
                  promise.resolve("file://$filePath")
              } else {
                  promise.reject("NO_PATH", "Could not resolve file path from URI")
              }
          } else {
              promise.resolve(contentUri)
          }
      } catch (e: Exception) {
          promise.reject("ERROR", e.message, e)
      }
  }

  private fun getRealPathFromUri(uri: Uri): String? {
      val projection = arrayOf(MediaStore.MediaColumns.DATA)
      val contentResolver: ContentResolver = reactApplicationContext.contentResolver
      val cursor: Cursor? = contentResolver.query(uri, projection, null, null, null)
      cursor?.use {
          if (it.moveToFirst()) {
              val columnIndex = it.getColumnIndexOrThrow(MediaStore.MediaColumns.DATA)
              return it.getString(columnIndex)
          }
      }
      return null
  }
}