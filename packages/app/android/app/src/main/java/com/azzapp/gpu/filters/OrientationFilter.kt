package com.azzapp.gpu.filters

import android.opengl.GLES20
import com.azzapp.gpu.utils.FrameBufferPool
import com.azzapp.gpu.utils.GLESUtils
import com.azzapp.gpu.utils.GLFrame
import com.azzapp.gpu.utils.GLFramePool
import com.azzapp.gpu.utils.GLProgram
import com.azzapp.gpu.utils.ImageOrientation

class OrientationFilter: Filter<OrientationFilter.Parameters> {

  class Parameters(
    val inputImage: GLFrame,
    val orientation: ImageOrientation,
  )

  var glProgram = GLProgram(VERTEX_SHADER, FRAGMENT_SHADER)

  override fun draw(parameters: Parameters, glFramePool: GLFramePool, frameBufferPool: FrameBufferPool): GLFrame {
    val inputImage = parameters.inputImage
    val orientation = parameters.orientation

    val inverseRatio = orientation == ImageOrientation.LEFT || orientation == ImageOrientation.RIGHT

    val width = if(inverseRatio) inputImage.height else inputImage.width
    val height = if(inverseRatio) inputImage.width else inputImage.height

    val outputImage = glFramePool.getGlFrame()
    GLESUtils.bindRGBATexture(
      outputImage.texture,
      width,
      height,
    )
    outputImage.width = width
    outputImage.height = height

    val frameBuffer = frameBufferPool.getFrameBuffer()
    GLESUtils.focuFrameBuffer(frameBuffer, outputImage.texture)

    glProgram.use()

    GLES20.glViewport(0, 0, width, height)

    GLES20.glDisable(GLES20.GL_BLEND)
    GLES20.glClearColor(0f,0f,0f,0f)
    GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT)


    val aFramePosition = glProgram.getAttribLocation("aFramePosition")
    GLES20.glEnableVertexAttribArray(aFramePosition)
    GLES20.glVertexAttribPointer(
      aFramePosition, 4, GLES20.GL_FLOAT, false, 0,
      GLESUtils.DEFAULT_VERTICES_COORD
    )

    val aTexCoords = glProgram.getAttribLocation("aTexCoords")
    GLES20.glEnableVertexAttribArray(aTexCoords)
    GLES20.glVertexAttribPointer(
      aTexCoords, 2, GLES20.GL_FLOAT, false, 0,
      GLESUtils.DEFAULT_TEX_COORD
    )

    val uTexSampler = glProgram.getUniformLocation("uTexSampler")
    GLES20.glActiveTexture(GLES20.GL_TEXTURE0)
    GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, inputImage.texture)
    GLES20.glUniform1i(uTexSampler, 0)

    val uOrientation = glProgram.getUniformLocation("uOrientation")
    GLES20.glUniform1f(uOrientation, when(orientation) {
      ImageOrientation.UP -> 0f
      ImageOrientation.LEFT -> 90f
      ImageOrientation.DOWN -> 180f
      ImageOrientation.RIGHT -> 270f
    })

    GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4)

    frameBufferPool.releaseFrameBuffer(frameBuffer)
    return outputImage
  }

  override fun release() {
    glProgram.release()
  }

  companion object {
    val NAME = "OrientationFilter"

    private val VERTEX_SHADER = """
      attribute vec4 aFramePosition;
      attribute vec2 aTexCoords;
      varying vec2 vTexCoords;
      void main() {
       gl_Position = aFramePosition;
       vTexCoords = aTexCoords.xy;
      }
    """.trimIndent()


    private val FRAGMENT_SHADER = """
      precision highp float;

      uniform sampler2D uTexSampler;
      uniform float uOrientation;
      varying vec2 vTexCoords;

      void main() {
        float rad = radians(uOrientation);
        float sinVal = sin(rad);
        float cosVal = cos(rad);

        vec2 texCoord = vec2(
          0.5 + (vTexCoords.x - 0.5) * cosVal - (vTexCoords.y - 0.5) * sinVal,
          0.5 + (vTexCoords.x - 0.5) * sinVal + (vTexCoords.y - 0.5) * cosVal
        );

        gl_FragColor = texture2D(uTexSampler, texCoord);
      }
    """.trimIndent()
  }
}
