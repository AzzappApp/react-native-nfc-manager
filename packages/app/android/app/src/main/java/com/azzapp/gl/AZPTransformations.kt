package com.azzapp.gl


import android.media.effect.EffectFactory
import com.facebook.react.bridge.ReadableMap
import kotlin.math.round


typealias AZPTransformation = (
  inputImage: GLFrame,
  outputImage: GLFrame?,
  parameters: ReadableMap?,
  factory: EffectFactory
) -> GLFrame

object AZPTransformations {
  private val transformations = mutableMapOf<String, AZPTransformation>()

  init {
    transformations["noir"] = { image, output, _, factory ->
      applyEffect(image, output, EffectFactory.EFFECT_SATURATE, mapOf("scale" to -1f), factory)
    }
    transformations["process"] = { image, output, _, factory ->
      applyEffect(image, output, EffectFactory.EFFECT_CROSSPROCESS, null, factory)
    }
    transformations["documentary"] = { image, output, _, factory ->
      applyEffect(image, output, EffectFactory.EFFECT_DOCUMENTARY, null, factory)
    }
    transformations["lomoish"] = { image, output, _, factory ->
      applyEffect(image, output, EffectFactory.EFFECT_LOMOISH, null, factory)
    }
    transformations["negative"] = { image, output, _, factory ->
      applyEffect(image, output, EffectFactory.EFFECT_NEGATIVE, null, factory)
    }
    transformations["posterize"] = { image, output, _, factory ->
      applyEffect(image, output, EffectFactory.EFFECT_POSTERIZE, null, factory)
    }
    transformations["sepia"] = { image, output, _, factory ->
      applyEffect(image, output, EffectFactory.EFFECT_SEPIA, null, factory)
    }
  }

  fun registerTransformation(name: String, transformation: AZPTransformation) {
    transformations[name] = transformation
  }

  fun transformationForName(name: String): AZPTransformation? {
    return transformations[name]
  }


  fun applyEditorTransform(
    inputImage: GLFrame,
    parameters: ReadableMap?,
    effectFactory: EffectFactory
  ): GLFrame? {
    if (parameters == null) {
      return null
    }
    var outputImage: GLFrame? = null
    var currentImage = inputImage
    var shouldRelease = false;

    val orientationAngle =
      when (parameters.getString("orientation")) {
        "RIGHT" -> 90
        "DOWN" -> 180
        "LEFT" -> 270
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


    val cropData = parameters.getMap("cropData")
    if (cropData != null && EffectFactory.isEffectSupported(EffectFactory.EFFECT_CROP)) {
      var originX = round(cropData.getDouble("originX")).toInt()
      var originY = round(cropData.getDouble("originY")).toInt()
      var width = round(cropData.getDouble("width")).toInt()
      var height = round(cropData.getDouble("height")).toInt()

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
    val roll = if (parameters.hasKey("roll")) parameters.getInt("roll") else 0
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

    if (parameters.hasKey("brightness")) {
      outputImage = applyEffect(
        currentImage,
        outputImage,
        EffectFactory.EFFECT_BRIGHTNESS,
        mapOf("brightness" to parameters.getDouble("brightness").toFloat()),
        effectFactory
      )
      currentImage = outputImage
    }

    if (parameters.hasKey("contrast")) {
      outputImage = applyEffect(
        currentImage,
        outputImage,
        EffectFactory.EFFECT_CONTRAST,
        mapOf("contrast" to parameters.getDouble("contrast").toFloat()),
        effectFactory
      )
      currentImage = outputImage
    }

    if (parameters.hasKey("saturation")) {
      outputImage = applyEffect(
        currentImage,
        outputImage,
        EffectFactory.EFFECT_SATURATE,
        mapOf("scale" to parameters.getDouble("saturation").toFloat()),
        effectFactory
      )
      currentImage = outputImage
    }

    if (parameters.hasKey("sharpness")) {
      outputImage = applyEffect(
        currentImage,
        outputImage,
        EffectFactory.EFFECT_SHARPEN,
        mapOf("scale" to parameters.getDouble("sharpness").toFloat()),
        effectFactory
      )
      currentImage = outputImage
    }

    if (parameters.hasKey("temperature")) {
      outputImage = applyEffect(
        currentImage,
        outputImage,
        EffectFactory.EFFECT_TEMPERATURE,
        mapOf("scale" to parameters.getDouble("temperature").toFloat()),
        effectFactory
      )
      currentImage = outputImage
    }

    if (parameters.hasKey("vignetting")) {
      outputImage = applyEffect(
        currentImage,
        outputImage,
        EffectFactory.EFFECT_VIGNETTE,
        mapOf("scale" to parameters.getDouble("vignetting").toFloat()),
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


