package com.azzapp.gpu.filters

import android.graphics.Matrix
import android.graphics.PointF
import android.opengl.GLES20
import com.azzapp.gpu.utils.FrameBufferPool
import com.azzapp.gpu.utils.GLESUtils
import com.azzapp.gpu.utils.GLFrame
import com.azzapp.gpu.utils.GLFramePool
import com.azzapp.gpu.utils.GLProgram
import kotlin.math.cos
import kotlin.math.sin

class RotationFilter: Filter<RotationFilter.Parameters> {

  class Parameters(
    val inputImage: GLFrame,
    val angle: Float,
  )

  var glProgram = GLProgram(VERTEX_SHADER, FRAGMENT_SHADER)

  override fun draw(parameters: Parameters, glFramePool: GLFramePool, frameBufferPool: FrameBufferPool): GLFrame {
    val inputImage = parameters.inputImage
    val angle = Math.toRadians(parameters.angle.toDouble())

    val outputImage = glFramePool.getGlFrame()
    GLESUtils.bindRGBATexture(
      outputImage.texture,
      inputImage.width,
      inputImage.height,
    )
    outputImage.width = inputImage.width
    outputImage.height = inputImage.height

    val frameBuffer = frameBufferPool.getFrameBuffer()
    GLESUtils.focuFrameBuffer(frameBuffer, outputImage.texture)

    glProgram.use()

    GLES20.glViewport(0, 0, inputImage.width, inputImage.height)

    GLES20.glDisable(GLES20.GL_BLEND)
    GLES20.glClearColor(0f,0f,0f,0f)
    GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT)

    val rectWidth = inputImage.width.toDouble()
    val rectHeight = inputImage.height.toDouble()
    val (topLeftX, topLeftY) = rotatePoint(0.0, 0.0, angle, rectWidth, rectHeight)
    val (topRightX, topRightY) = rotatePoint(rectWidth, 0.0, angle, rectWidth, rectHeight)
    var (bottomLeftX, bottomLeftY) = rotatePoint(0.0, rectHeight, angle, rectWidth, rectHeight)
    var (bottomRightX, bottomRightY)  = rotatePoint(rectWidth, rectHeight, angle, rectWidth, rectHeight)

    val positions = GLESUtils.floatBuffer(
      bottomLeftX, bottomLeftY, 0f, 1f,
      bottomRightX, bottomRightY, 0f, 1f,
      topLeftX, topLeftY, 0f, 1f,
      topRightX,topRightY, 0f, 1f
    )

    val aFramePosition = glProgram.getAttribLocation("aFramePosition")
    GLES20.glEnableVertexAttribArray(aFramePosition)
    GLES20.glVertexAttribPointer(
      aFramePosition, 4, GLES20.GL_FLOAT, false, 0,
      positions
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


    GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4)

    frameBufferPool.releaseFrameBuffer(frameBuffer)
    return outputImage
  }

  override fun release() {
    glProgram.release()
  }

  companion object {
    val NAME = "RotationFilter"

    private val VERTEX_SHADER = """
      attribute vec4 aFramePosition;
      attribute vec2 aTexCoords;
      varying vec2 vTexCoords;

      void main() {
        gl_Position = aFramePosition;
        vTexCoords = aTexCoords;
      }
    """.trimIndent()


    private val FRAGMENT_SHADER = """
      precision highp float;

      uniform sampler2D uTexSampler;
      varying vec2 vTexCoords;

      void main() {
        gl_FragColor = texture2D(uTexSampler, vTexCoords);
      }
    """.trimIndent()
  }


  fun rotatePoint(x: Double, y: Double, angle: Double, width: Double, height: Double): Pair<Float,Float> {
    val cos = cos(angle)
    val sin = sin(angle)
    val dx = x - width / 2
    val dy = y - height / 2

    var x = cos * dx - sin * dy + width / 2
    var y = sin * dx + cos * dy + height / 2

    x = (x / width) * 2 - 1
    y = 1 - (y / height) * 2 

    return Pair(x.toFloat(), y.toFloat())
  }
}
