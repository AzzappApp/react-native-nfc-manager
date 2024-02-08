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
  ): GLFrame {
    if (parameters == null) {
      return inputImage
    }
    var currentImage = inputImage

    fun transformImage(transform: (input: GLFrame, output: GLFrame) -> Unit) {
      val outputImage = GLFrame.create()
      outputImage.x = currentImage.x
      outputImage.y = currentImage.y
      outputImage.width = currentImage.width
      outputImage.height = currentImage.height

      transform(currentImage, outputImage)
      if (currentImage !== inputImage) {
        currentImage.release()
      }
      currentImage = outputImage
    }

    val orientationAngle =
      when (parameters.orientation) {
        GPULayer.ImageOrientation.RIGHT -> 90
        GPULayer.ImageOrientation.DOWN -> 180
        GPULayer.ImageOrientation.LEFT -> 270
        else -> 0
      }

    if (orientationAngle != 0 && EffectFactory.isEffectSupported(EffectFactory.EFFECT_ROTATE)) {
      transformImage { input, output ->
        applyEffect(
          input,
          output,
          EffectFactory.EFFECT_ROTATE,
          mapOf("angle" to orientationAngle),
          effectFactory
        )

        if (orientationAngle == 90 || orientationAngle == 270) {
          output.width = input.height
          output.height = input.width
        }
      }
    }


    val cropData = parameters.cropData
    if (cropData != null && EffectFactory.isEffectSupported(EffectFactory.EFFECT_CROP)) {
      transformImage { input, output ->
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
          if (right > input.width) {
            x = -(right - input.width)
          }
          if (bottom > input.height) {
            y = -(bottom - input.height)
          }
          originX += x
          originY += y

          applyEffect(
            input,
            output,
            EffectFactory.EFFECT_CROP,
            mapOf(
              "xorigin" to originX,
              "yorigin" to originY,
              "width" to width,
              "height" to height
            ),
            effectFactory
          )

          output.x = x
          output.y = y
          output.width = width
          output.height = height
        }
      }
    }

    /* TODO roll on Android and IOS works differently since EFFECT_STRAIGHTEN not only
        roll but also crop the image, that's why on android we apply the roll after the crop,
        but this might lead to imprecise calculation of the image size on js part */
    val roll = if (parameters.roll != null) round(parameters.roll) else 0
    if (roll != 0 && EffectFactory.isEffectSupported(EffectFactory.EFFECT_STRAIGHTEN)) {
      transformImage { input, output ->
        applyEffect(
          input,
          output,
          EffectFactory.EFFECT_STRAIGHTEN,
          mapOf(
            "angle" to roll.toFloat(),
          ),
          effectFactory
        )
      }
    }


    // MAY DO highlights, shadow, structure, tint, vibrance

    if (parameters.brightness != null && EffectFactory.isEffectSupported(EffectFactory.EFFECT_BRIGHTNESS)) {
      transformImage { input, output ->
        applyEffect(
          input,
          output,
          EffectFactory.EFFECT_BRIGHTNESS,
          mapOf("brightness" to parameters.brightness.toFloat()),
          effectFactory
        )
      }
    }

    if (parameters.contrast != null && EffectFactory.isEffectSupported(EffectFactory.EFFECT_CONTRAST)) {
      transformImage { input, output ->
        applyEffect(
          input,
          output,
          EffectFactory.EFFECT_CONTRAST,
          mapOf("contrast" to parameters.contrast.toFloat()),
          effectFactory
        )
      }
    }

    if (parameters.saturation != null && EffectFactory.isEffectSupported(EffectFactory.EFFECT_SATURATE)) {
      transformImage { input, output ->
        applyEffect(
          input,
          output,
          EffectFactory.EFFECT_SATURATE,
          mapOf("scale" to parameters.saturation.toFloat()),
          effectFactory
        )
      }
    }

    if (parameters.sharpness != null && EffectFactory.isEffectSupported(EffectFactory.EFFECT_SHARPEN)) {
      transformImage { input, output ->
        applyEffect(
          input,
          output,
          EffectFactory.EFFECT_SHARPEN,
          mapOf("scale" to parameters.sharpness.toFloat()),
          effectFactory
        )
      }
    }

    if (parameters.temperature != null && EffectFactory.isEffectSupported(EffectFactory.EFFECT_TEMPERATURE)) {
      transformImage { input, output ->
        applyEffect(
          input,
          output,
          EffectFactory.EFFECT_TEMPERATURE,
          mapOf("scale" to parameters.temperature.toFloat()),
          effectFactory
        )
      }
    }

    if (parameters.vignetting != null && EffectFactory.isEffectSupported(EffectFactory.EFFECT_VIGNETTE)) {
      transformImage { input, output ->
        applyEffect(
          input,
          output,
          EffectFactory.EFFECT_VIGNETTE,
          mapOf("scale" to parameters.vignetting.toFloat()),
          effectFactory
        )
      }
    }

    return currentImage
  }

  fun applyEffect(
    inputImage: GLFrame,
    outputImage: GLFrame,
    effectName: String,
    parameters: Map<String, Any>?,
    effectFactory: EffectFactory
  ) {
    val effect = effectFactory.createEffect(effectName)
    parameters?.forEach { entry ->
      effect.setParameter(entry.key, entry.value)
    }

    effect.apply(
      inputImage.texture,
      inputImage.width,
      inputImage.height,
      outputImage.texture
    )
  }
}