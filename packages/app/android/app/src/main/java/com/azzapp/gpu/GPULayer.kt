package com.azzapp.gpu

import android.net.Uri
import com.azzapp.helpers.RNHelpers
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap

class GPULayer(
  val source: GPULayerSource,
  val parameters: EditionParameters?,
  val maskUri: Uri?,
  val lutFilterUri: Uri?,
  val backgroundColor: String?,
  val tintColor: String?
) {
  class GPULayerSource(
    val kind: GPULayerKind,
    val uri: Uri,
    val startTime: Double?,
    val duration: Double?
  ) {
    fun stringRepresentation(): String {
      val time = startTime ?: 0
      val kindStr = when(kind) {
        GPULayerKind.IMAGE -> "image"
        GPULayerKind.VIDEO -> "video"
        GPULayerKind.VIDEO_FRAME -> "videoFrame"
      }
      return "$kindStr-${uri.toString()}-${time.toString()}"
    }
  }

  enum class GPULayerKind {
    VIDEO,
    IMAGE,
    VIDEO_FRAME,
  }

  class EditionParameters(
    val brightness: Double?,
    val contrast: Double?,
    val highlights: Double?,
    val saturation: Double?,
    val shadow: Double?,
    val sharpness: Double?,
    val structure: Double?,
    val temperature: Double?,
    val tint: Double?,
    val vibrance: Double?,
    val vignetting: Double?,
    val pitch: Double?,
    val roll: Double?,
    val yaw: Double?,
    val cropData: CropData?,
    val orientation: ImageOrientation?
  ) {


    companion object {
      fun fromReadableMap(readableMap: ReadableMap): EditionParameters {
        var cropData: CropData? = null
        val cropDataMap = readableMap.getMap("cropData")
        if (cropDataMap != null) {
          val originX = RNHelpers.readDoubleIfHasKey(cropDataMap, "originX")
          val originY = RNHelpers.readDoubleIfHasKey(cropDataMap, "originY")
          val width = RNHelpers.readDoubleIfHasKey(cropDataMap, "width")
          val height = RNHelpers.readDoubleIfHasKey(cropDataMap, "height")
          if (originX != null && originY != null && width != null &&
            height !=null && width> 0 && height > 0) {
            cropData = CropData(
              originX,
              originY,
              width,
              height
            )
          }
        }

        var orientation: ImageOrientation? = when(readableMap.getString("orientation")) {
          "RIGHT" -> ImageOrientation.RIGHT
          "DOWN" -> ImageOrientation.DOWN
          "UP" -> ImageOrientation.UP
          "LEFT" -> ImageOrientation.LEFT
          else -> null
        }

        return EditionParameters(
          RNHelpers.readDoubleIfHasKey(readableMap,"brightness"),
          RNHelpers.readDoubleIfHasKey(readableMap,"contrast"),
          RNHelpers.readDoubleIfHasKey(readableMap,"highlights"),
          RNHelpers.readDoubleIfHasKey(readableMap,"saturation"),
          RNHelpers.readDoubleIfHasKey(readableMap,"shadow"),
          RNHelpers.readDoubleIfHasKey(readableMap,"sharpness"),
          RNHelpers.readDoubleIfHasKey(readableMap,"structure"),
          RNHelpers.readDoubleIfHasKey(readableMap,"temperature"),
          RNHelpers.readDoubleIfHasKey(readableMap,"tint"),
          RNHelpers.readDoubleIfHasKey(readableMap,"vibrance"),
          RNHelpers.readDoubleIfHasKey(readableMap,"vignetting"),
          RNHelpers.readDoubleIfHasKey(readableMap,"pitch"),
          RNHelpers.readDoubleIfHasKey(readableMap,"roll"),
          RNHelpers.readDoubleIfHasKey(readableMap,"yaw"),
          cropData,
          orientation
        )
      }
    }
  }

  enum class ImageOrientation {
    UP,
    RIGHT,
    DOWN,
    LEFT,
  }

  class CropData(
    val originX: Double,
    val originY: Double,
    val width: Double,
    val height: Double
  )

  companion object {
    fun fromReadableMap(readableMap: ReadableMap): GPULayer? {
      val kindStr = readableMap.getString("kind")
      val uriStr = readableMap.getString("uri")
      val maskUriStr = readableMap.getString("maskUri")
      val editionParameters = readableMap.getMap("parameters")
      val lutFilterUriStr = readableMap.getString("lutFilterUri")

      val startTime = RNHelpers.readDoubleIfHasKey( readableMap, "startTime")
      val duration = RNHelpers.readDoubleIfHasKey( readableMap, "duration")
      val time = RNHelpers.readDoubleIfHasKey( readableMap, "time")
      val backgroundColor = readableMap.getString("backgroundColor")
      val tintColor = readableMap.getString("tintColor")

      val uri = try { Uri.parse(uriStr) } catch(e: NullPointerException) { null }
      if (uri === null) {
        return null;
      }

      val layerKind = when(kindStr) {
        "video" -> GPULayerKind.VIDEO
        "videoFrame" -> GPULayerKind.VIDEO_FRAME
        "image" -> GPULayerKind.IMAGE
        else -> null
      }
      if (layerKind === null) {
        return null
      }

      val source = GPULayerSource(
        layerKind,
        uri,
        when(layerKind) {
          GPULayerKind.VIDEO -> startTime
          GPULayerKind.VIDEO_FRAME -> time
          else -> null
        },
        when(layerKind) {
          GPULayerKind.VIDEO -> duration
          else -> null
        },
      )

      val maskUri =
        if (maskUriStr !== null)
          try { Uri.parse(maskUriStr) } catch (e: NullPointerException) { null }
        else null

      val lutFilterUri =
        if (lutFilterUriStr !== null)
          try { Uri.parse(lutFilterUriStr) } catch (e: NullPointerException) { null }
        else null

      return GPULayer(
        source,
        if (editionParameters != null) EditionParameters.fromReadableMap(editionParameters) else null,
        maskUri,
        lutFilterUri,
        backgroundColor,
        tintColor
      )
    }

    fun extractLayers(layers: ReadableArray?): List<GPULayer>? {
      if (layers == null) {
        return null
      }
      val result = mutableListOf<GPULayer>()
      for (i in 0 until layers.size()) {
        val map = layers.getMap(i)
        val layer = if (map != null) fromReadableMap(map) else null
        if (layer != null) {
          result.add(i, layer)
        }
      }
      return result
    }
  }
}