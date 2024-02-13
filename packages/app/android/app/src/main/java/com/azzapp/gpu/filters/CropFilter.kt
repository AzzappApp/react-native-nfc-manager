package com.azzapp.gpu.filters

import android.opengl.GLES20
import com.azzapp.gpu.utils.GLFrame
import com.azzapp.gpu.utils.FrameBufferPool
import com.azzapp.gpu.utils.GLFramePool
import com.azzapp.gpu.utils.GLProgram
import com.azzapp.gpu.utils.GLESUtils

class CropFilter: Filter<CropFilter.Parameters> {

  class Parameters(
    val inputImage: GLFrame,
    val originX: Int,
    val originY: Int,
    val width: Int,
    val height: Int,
  )

  var glProgram = GLProgram(VERTEX_SHADER, FRAGMENT_SHADER)

  override fun draw(parameters: Parameters, glFramePool: GLFramePool, frameBufferPool: FrameBufferPool): GLFrame {
    val inputImage = parameters.inputImage
    val originX = parameters.originX
    val originY = parameters.originY
    val width = parameters.width
    val height = parameters.height


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

    val top = 1f - originY.toFloat() / inputImage.height.toFloat()
    val bottom = 1f - (originY.toFloat() + height.toFloat()) / inputImage.height.toFloat()
    val left = originX.toFloat() / inputImage.width.toFloat()
    val right = (originX.toFloat() + width.toFloat() )/ inputImage.width.toFloat()

    val aTexCoords = glProgram.getAttribLocation("aTexCoords")
    GLES20.glEnableVertexAttribArray(aTexCoords)
    GLES20.glVertexAttribPointer(
      aTexCoords, 2, GLES20.GL_FLOAT, false, 0,
      GLESUtils.floatBuffer(
        left, bottom,
        right, bottom,
        left, top,
        right, top,
      )
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
    val NAME = "CropFilter"

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
      precision mediump float;
      uniform sampler2D uTexSampler;
      varying vec2 vTexCoords;
      void main() {
        gl_FragColor = texture2D(uTexSampler, vTexCoords);
      }
    """.trimIndent()
  }
}
