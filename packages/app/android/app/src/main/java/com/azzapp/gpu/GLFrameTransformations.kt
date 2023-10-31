package com.azzapp.gpu


import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.effect.EffectFactory
import android.opengl.GLES20
import com.facebook.react.bridge.ReadableMap
import java.io.IOException
import java.io.InputStream
import kotlin.math.round


typealias AZPTransformation = (
  inputImage: GLFrame,
  outputImage: GLFrame?,
  parameters: ReadableMap?,
  factory: EffectFactory
) -> GLFrame

object GLFrameTransformations {

  fun applyEditorTransform(
    inputImage: GLFrame,
    parameters: GPULayer.EditionParameters?,
    effectFactory: EffectFactory
  ): GLFrame? {
    if (parameters == null) {
      return null
    }
    var outputImage: GLFrame? = null
    var currentImage = inputImage
    var shouldRelease = false;

    val orientationAngle =
      when (parameters.orientation) {
        GPULayer.ImageOrientation.RIGHT -> 90
        GPULayer.ImageOrientation.DOWN -> 180
        GPULayer.ImageOrientation.LEFT -> 270
        else -> 0
      }

    if (orientationAngle != 0 && EffectFactory.isEffectSupported(EffectFactory.EFFECT_ROTATE)) {
      outputImage = applyEffect(
        currentImage,
        null,
        EffectFactory.EFFECT_ROTATE,
        mapOf("angle" to orientationAngle),
        effectFactory
      )

      if (orientationAngle == 90 || orientationAngle == 270) {
        outputImage.width = currentImage.height
        outputImage.height = currentImage.width
      }
      shouldRelease = true;
      currentImage = outputImage
    }


    val cropData = parameters.cropData
    if (cropData != null && EffectFactory.isEffectSupported(EffectFactory.EFFECT_CROP)) {
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

        outputImage = applyEffect(
          currentImage,
          null,
          EffectFactory.EFFECT_CROP,
          mapOf(
            "xorigin" to originX,
            "yorigin" to originY,
            "width" to width,
            "height" to height
          ),
          effectFactory
        )

        outputImage.x = x
        outputImage.y = y
        outputImage.width = width
        outputImage.height = height

        if (shouldRelease) {
          currentImage.release()
        }
        currentImage = outputImage
        shouldRelease = true;
      }
    }

    /* TODO roll on Android and IOS works differently since EFFECT_STRAIGHTEN not only
        roll but also crop the image, that's why on android we apply the roll after the crop,
        but this might lead to imprecise calculation of the image size on js part */
    val roll = if (parameters.roll != null) round(parameters.roll) else 0
    if (roll != 0 && EffectFactory.isEffectSupported(EffectFactory.EFFECT_STRAIGHTEN)) {
      outputImage = applyEffect(
        currentImage,
        null,
        EffectFactory.EFFECT_STRAIGHTEN,
        mapOf(
          "angle" to roll.toFloat(),
        ),
        effectFactory
      )

      if (shouldRelease) {
        currentImage.release()
      }
      currentImage = outputImage
    }


    // MAY DO highlights, shadow, structure, tint, vibrance

    if (parameters.brightness != null) {
      outputImage = applyEffect(
        currentImage,
        outputImage,
        EffectFactory.EFFECT_BRIGHTNESS,
        mapOf("brightness" to parameters.brightness.toFloat()),
        effectFactory
      )
      currentImage = outputImage
    }

    if (parameters.contrast != null) {
      outputImage = applyEffect(
        currentImage,
        outputImage,
        EffectFactory.EFFECT_CONTRAST,
        mapOf("contrast" to parameters.contrast.toFloat()),
        effectFactory
      )
      currentImage = outputImage
    }

    if (parameters.saturation != null) {
      outputImage = applyEffect(
        currentImage,
        outputImage,
        EffectFactory.EFFECT_SATURATE,
        mapOf("scale" to parameters.saturation.toFloat()),
        effectFactory
      )
      currentImage = outputImage
    }

    if (parameters.sharpness != null) {
      outputImage = applyEffect(
        currentImage,
        outputImage,
        EffectFactory.EFFECT_SHARPEN,
        mapOf("scale" to parameters.sharpness.toFloat()),
        effectFactory
      )
      currentImage = outputImage
    }

    if (parameters.temperature != null) {
      outputImage = applyEffect(
        currentImage,
        outputImage,
        EffectFactory.EFFECT_TEMPERATURE,
        mapOf("scale" to parameters.temperature.toFloat()),
        effectFactory
      )
      currentImage = outputImage
    }

    if (parameters.vignetting != null) {
      outputImage = applyEffect(
        currentImage,
        outputImage,
        EffectFactory.EFFECT_VIGNETTE,
        mapOf("scale" to parameters.vignetting.toFloat()),
        effectFactory
      )
    }

    return outputImage
  }

  fun applyEffect(
    inputImage: GLFrame,
    outputImage: GLFrame?,
    effectName: String,
    parameters: Map<String, Any>?,
    effectFactory: EffectFactory
  ): GLFrame {
    if (!EffectFactory.isEffectSupported(effectName)) {
      return inputImage
    }
    val result = outputImage ?: GLFrame.create(
      inputImage.x,
      inputImage.y,
      inputImage.width,
      inputImage.height
    );

    val effect = effectFactory.createEffect(effectName)
    parameters?.forEach { entry ->
      effect.setParameter(entry.key, entry.value)
    }

    effect.apply(
      inputImage.texture,
      inputImage.width,
      inputImage.height,
      result.texture
    )
    return result
  }
}
