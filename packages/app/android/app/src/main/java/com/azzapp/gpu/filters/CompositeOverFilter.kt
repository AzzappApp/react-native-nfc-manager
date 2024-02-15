package com.azzapp.gpu.filters

import android.opengl.GLES20
import com.azzapp.gpu.utils.GLFrame
import com.azzapp.gpu.utils.FrameBufferPool
import com.azzapp.gpu.utils.GLFramePool
import com.azzapp.gpu.utils.GLProgram
import com.azzapp.gpu.utils.GLESUtils

class CompositeOverFilter: Filter<CompositeOverFilter.Parameters> {

  class Parameters(
    val inputImage: GLFrame,
    val underlayImage: GLFrame
  )

  var glProgram = GLProgram(VERTEX_SHADER, FRAGMENT_SHADER)

  override fun draw(parameters: Parameters, glFramePool: GLFramePool, frameBufferPool: FrameBufferPool): GLFrame {
    val inputImage = parameters.inputImage
    val underlayImage = parameters.underlayImage

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

    GLES20.glViewport(inputImage.x, inputImage.y, inputImage.width, inputImage.height)

    GLES20.glDisable(GLES20.GL_BLEND)
    GLES20.glClearColor(0f,0f,0f,0f)
    GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT)

    GLES20.glEnable(GLES20.GL_BLEND)

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

    var underlayTextSampler = glProgram.getUniformLocation("underlayTextSampler")
    GLES20.glActiveTexture(GLES20.GL_TEXTURE1)
    GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, underlayImage.texture)
    GLES20.glUniform1i(underlayTextSampler, 1)

    GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4)

    frameBufferPool.releaseFrameBuffer(frameBuffer)
    return outputImage
  }

  override fun release() {
    glProgram.release()
  }

  companion object {
    val NAME = "CompositeOverFilter"

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
      uniform sampler2D underlayTextSampler;
      varying vec2 vTexCoords;
      void main() {
        vec4 texColor = texture2D(uTexSampler, vTexCoords);
        vec4 underlayTextColor = texture2D(underlayTextSampler, vTexCoords);
        gl_FragColor = mix(underlayTextColor, texColor, texColor.a);
      }
    """.trimIndent()

  }
}