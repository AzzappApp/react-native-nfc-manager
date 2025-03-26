package com.azzapp.media

import android.media.MediaMetadataRetriever
import android.net.Uri
import android.content.Context
import android.content.ContentResolver
import android.database.Cursor
import android.provider.MediaStore
import com.azzapp.MainApplication.Companion.getMainApplicationContext
import com.facebook.react.bridge.*
import java.io.ByteArrayInputStream
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.util.UUID

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

  /*
  * create a copy of content provider file: `contentUri`.
  * The copied file path is returned in the promise
  */
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

  @ReactMethod
  fun downloadContactImage(uriString: String, promise: Promise) {
      try {
          val context = reactContext
          val uri = Uri.parse(uriString)
          val inputStream: InputStream? = context.contentResolver.openInputStream(uri)

          if (inputStream != null) {
              // Generate a random file name with a .jpg extension
              val fileName = "${UUID.randomUUID()}.jpg"
              val cacheFile = File(context.cacheDir, fileName)

              // Write the input stream data to the cache file
              FileOutputStream(cacheFile).use { outputStream ->
                  inputStream.copyTo(outputStream)
              }

              inputStream.close()
              promise.resolve(cacheFile.absolutePath)   // Return the full path to the saved file
          } else {
              promise.reject("ERROR", "Cannot open input stream")  // InputStream could not be opened
          }
      } catch (e: Exception) {
          e.printStackTrace()
          promise.reject("ERROR", "unknown", e)  // InputStream could not be opened
      }
  }
  @ReactMethod
  fun downloadVCard(uriString: String, promise: Promise) {
      try {
          val context = reactContext
          val uri = Uri.parse(uriString)
          val inputStream: InputStream? = context.contentResolver.openInputStream(uri)

          if (inputStream != null) {
              // Generate a random file name with a .jpg extension
              val fileName = "${UUID.randomUUID()}.vcf"
              val cacheFile = File(context.cacheDir, fileName)

              // Write the input stream data to the cache file
              FileOutputStream(cacheFile).use { outputStream ->
                  inputStream.copyTo(outputStream)
              }

              inputStream.close()
              promise.resolve(cacheFile.absolutePath)   // Return the full path to the saved file
          } else {
              promise.reject("ERROR", "Cannot open input stream")  // InputStream could not be opened
          }
      } catch (e: Exception) {
          e.printStackTrace()
          promise.reject("ERROR", "unknown", e)  // InputStream could not be opened
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


  @ReactMethod
  fun copyAsset(fileName: String, targetDir: String, promise: Promise) {
      try {
          val context: Context = reactApplicationContext
          val assetManager = context.assets
          val inputStream: InputStream = assetManager.open(fileName)

          val cacheDir = File(context.cacheDir, targetDir)

          if (!cacheDir.exists()) {
              cacheDir.mkdirs()
          }

          val outFile = File(cacheDir, fileName)
          if (!outFile.exists()) {
            val created = outFile.createNewFile()
            if (!created) {
              throw Exception("Can’t create the file : ${outFile.absolutePath}")
            }
          }

          val outputStream = FileOutputStream(outFile)
          inputStream.copyTo(outputStream)
          outputStream.close()
          inputStream.close()

          val uri = Uri.fromFile(outFile)
          promise.resolve(uri.toString())
      } catch (e: Exception) {
          promise.reject("ASSET_READ_ERROR", "Error while reading image $fileName", e)
      }
    }
}