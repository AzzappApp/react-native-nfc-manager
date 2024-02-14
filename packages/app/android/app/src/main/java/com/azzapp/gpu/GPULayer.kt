package com.azzapp.gpu

import android.graphics.Color
import android.net.Uri
import android.opengl.GLES20
import com.azzapp.gpu.filters.BlendFilter
import com.azzapp.gpu.filters.BrightnessFilter
import com.azzapp.gpu.filters.ColorLUTFilter
import com.azzapp.gpu.filters.CompositeOverFilter
import com.azzapp.gpu.filters.ContrastFilter
import com.azzapp.gpu.filters.CropFilter
import com.azzapp.gpu.filters.OrientationFilter
import com.azzapp.gpu.filters.RotationFilter
import com.azzapp.gpu.filters.SaturationFilter
import com.azzapp.gpu.filters.SharpenFilter
import com.azzapp.gpu.filters.TemperatureFilter
import com.azzapp.gpu.filters.TintFilter
import com.azzapp.gpu.filters.VignetteFilter
import com.azzapp.gpu.utils.GLFrame
import com.azzapp.gpu.utils.GLObjectManager
import com.azzapp.gpu.utils.GLESUtils
import com.azzapp.gpu.utils.ImageOrientation
import com.azzapp.helpers.RNHelpers
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import kotlin.math.round

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



  class CropData(
    val originX: Double,
    val originY: Double,
    val width: Double,
    val height: Double
  )

  companion object {

    class LayerImages(
      val inputImage: GLFrame,
      val lutImage: GLFrame?,
      val maskImage: GLFrame?
    )

    fun drawLayer(layer: GPULayer, images: LayerImages, glObjectManager: GLObjectManager): GLFrame {
      var currentImage = GLFrame.createRef(images.inputImage)
      fun setImage(image: GLFrame) {
        if (currentImage !== image) {
          currentImage.release()
        }
        currentImage = image
      }

      if (layer.backgroundColor != null && layer.backgroundColor.lowercase() != "transparent") {
        val backgroundColorImage = glObjectManager.getGlFrame()
        backgroundColorImage.x = currentImage.x
        backgroundColorImage.y = currentImage.y
        backgroundColorImage.width = currentImage.width
        backgroundColorImage.height = currentImage.height

        GLESUtils.bindRGBATexture(backgroundColorImage.texture, currentImage.width, currentImage.height)

        val frameBuffer = glObjectManager.getFrameBuffer()
        GLESUtils.focuFrameBuffer(frameBuffer, backgroundColorImage.texture)
        val color = try {
          Color.parseColor(layer.backgroundColor)
        } catch (e: IllegalArgumentException){
          Color.BLACK
        }
        val r = (color shr 16 and 0xff) / 255.0f
        val g = (color shr 8 and 0xff) / 255.0f
        val b = (color and 0xff) / 255.0f
        val a = (color shr 24 and 0xff) / 255.0f
        GLES20.glViewport(currentImage.x, currentImage.y, currentImage.width, currentImage.height)
        GLES20.glClearColor(r, g, b, a)
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT)
        glObjectManager.releaseFrameBuffer(frameBuffer)

        val compositedImage = glObjectManager.applyCompositeOverFilter(
          CompositeOverFilter.Parameters(
            inputImage = currentImage,
            underlayImage = backgroundColorImage
          )
        )
        backgroundColorImage.release()

        setImage(compositedImage)
      }

      if (images.maskImage != null) {
        setImage(
          glObjectManager.applyBlendFilter(
            BlendFilter.Parameters(
              inputImage = currentImage,
              maskImage = images.maskImage
            ),
          )
        )
      }

      if (layer.tintColor != null) {
        val color = try { Color.parseColor(layer.tintColor) } catch (e: IllegalArgumentException){ Color.BLACK }
        setImage(
          glObjectManager.applyTintFilter(
            TintFilter.Parameters(
              inputImage = currentImage,
              tintColor = color
            ),
          )
        )
      }

      val parameters = layer.parameters

      val orientation = parameters?.orientation ?: ImageOrientation.UP
      if (orientation != ImageOrientation.UP) {
        setImage(
          glObjectManager.applyOrientationFilter(OrientationFilter.Parameters(
            inputImage = currentImage,
            orientation = orientation
          ))
        )
      }

      val roll = parameters?.roll ?: 0f
      if (roll != 0f) {
        setImage(
          glObjectManager.applyRotationFilter(RotationFilter.Parameters(
            inputImage = currentImage,
            angle = roll.toFloat()
          ))
        )
      }

      val cropData: CropData? = parameters?.cropData
      if (cropData != null) {
        var originX = round(cropData.originX).toInt()
        var originY = round(cropData.originY).toInt()
        var width = round(cropData.width).toInt()
        var height = round(cropData.height).toInt()

        if (width != 0 && height != 0) {
          var x = 0
          var y = 0
          if (originX < 0) {
            x = -originX
          }
          if (originY < 0) {
            y = -originY
          }
          val right = originX + width
          val bottom = originY + height
          if (right > currentImage.width) {
            x = -(right - currentImage.width)
          }
          if (bottom > currentImage.height) {
            y = -(bottom - currentImage.height)
          }
          originX += x
          originY += y

          val croppedImage = glObjectManager.applyCrop(
            CropFilter.Parameters(
              inputImage = currentImage,
              originX = originX,
              originY = originY,
              width = width,
              height = height
            )
          )
          croppedImage.x = x
          croppedImage.y = y

          setImage(croppedImage)
        }
      }

      val brightness = parameters?.brightness
      if (brightness != null) {
        setImage(
          glObjectManager.applyBrightnessFilter(
            BrightnessFilter.Parameters(
              inputImage = currentImage,
              brightness = brightness.toFloat()
            )
          )
        )
      }

      val contrast = parameters?.contrast
      if (contrast != null) {
        setImage(
          glObjectManager.applyContrastFilter(
            ContrastFilter.Parameters(
              inputImage = currentImage,
              contrast = contrast.toFloat()
            )
          )
        )
      }

      var saturation = parameters?.saturation
      if (saturation != null) {
        setImage(
          glObjectManager.applySaturationFilter(
            SaturationFilter.Parameters(
              inputImage = currentImage,
              saturation = saturation.toFloat()
            )
          )
        )
      }

      var sharpness = parameters?.sharpness
      if (sharpness != null) {
        setImage(
          glObjectManager.applySharpenFilter(
            SharpenFilter.Parameters(
              inputImage = currentImage,
              sharpness = sharpness.toFloat()
            )
          )
        )
      }

      var temperature = parameters?.temperature
      if (temperature != null) {
        setImage(
          glObjectManager.applyTemperatureFilter(
            TemperatureFilter.Parameters(
              inputImage = currentImage,
              temperature = temperature.toFloat()
            )
          )
        )
      }

      var vignetting = parameters?.vignetting
      if (vignetting != null) {
        setImage(
          glObjectManager.applyVignetteFilter(
            VignetteFilter.Parameters(
              inputImage = currentImage,
              vignette = vignetting.toFloat()
            )
          )
        )
      }

      if (images.lutImage != null) {
        setImage(
          glObjectManager.applyColorLUTFilter(
            ColorLUTFilter.Parameters(
              inputImage = currentImage,
              lutImage = images.lutImage
            ),
          )
        )
      }

      return currentImage
    }

    fun drawLayers(layersWithImages: List<Pair<GPULayer, LayerImages>>, glObjectManager: GLObjectManager): GLFrame? {
      var currentImage: GLFrame? = null
      for ((layer, layerImages) in layersWithImages) {
        val layerImage = drawLayer(layer, layerImages, glObjectManager)
        if(currentImage != null) {
          val compositedImage = glObjectManager.applyCompositeOverFilter(
            CompositeOverFilter.Parameters(
              inputImage = layerImage,
              underlayImage = currentImage
            ),
          )
          currentImage.release()
          layerImage.release()
          currentImage = compositedImage
        } else {
          currentImage = layerImage
        }
      }
      return currentImage
    }

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