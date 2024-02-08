package com.azzapp.gpu.effects

import android.opengl.GLES20
import com.azzapp.gpu.GLFrame
import com.azzapp.gpu.FrameBufferPool
import com.azzapp.gpu.ShaderUtils

class BlendEffect {

  private var blendRenderer: BlendRenderer = BlendRenderer()

  fun draw(inputImage: GLFrame, maskTexture: GLFrame, frameBufferPool: FrameBufferPool): GLFrame {
    val outputFrame = GLFrame.create()
    ShaderUtils.bindRGBATexture(
      outputFrame.texture,
      inputImage.width,
      inputImage.height,
    )
    outputFrame.width = inputImage.width
    outputFrame.height = inputImage.height

    val frameBuffer = frameBufferPool.getFrameBuffer()
    ShaderUtils.focuFrameBuffer(frameBuffer, outputFrame.texture)

    blendRenderer.draw(
      inputImage.texture,
      maskTexture.texture,
      0, 0,
      inputImage.width,
      inputImage.height
    )
    frameBufferPool.releaseFrameBuffer(frameBuffer)
    return outputFrame
  }

  fun release() {
    blendRenderer.release()
  }

  private  class BlendRenderer {
    var program = 0
    var aFramePositionLoc = 0
    var aTexCoordsLoc = 0
    var uTexSamplerLoc = 0
    var uMaskTexSamplerLoc = 0


    init {
      // Create program
      program = ShaderUtils.createProgram(
        VERTEX_SHADER,
        FRAGMENT_SHADER
      )

      // Bind attributes and uniforms
      aFramePositionLoc = GLES20.glGetAttribLocation(
        program,
        "aFramePosition"
      )
      aTexCoordsLoc = GLES20.glGetAttribLocation(
        program,
        "aTexCoords"
      )

      uTexSamplerLoc = GLES20.glGetUniformLocation(
        program,
        "uTexSampler"
      )

      uMaskTexSamplerLoc = GLES20.glGetUniformLocation(
        program,
        "uMaskTexSampler"
      )
    }

    fun draw(
      texture: Int,
      maskTexture: Int,
      x: Int,
      y: Int,
      width: Int,
      height: Int,
    ) {
      GLES20.glDisable(GLES20.GL_BLEND)
      GLES20.glClearColor(0f,0f,0f,0f)
      GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT)
      GLES20.glEnable(GLES20.GL_BLEND)

      GLES20.glUseProgram(program)
      GLES20.glViewport(x, y, width, height)

      GLES20.glEnableVertexAttribArray(aFramePositionLoc)
      GLES20.glVertexAttribPointer(
        aFramePositionLoc, 4, GLES20.GL_FLOAT, false, 0,
        POS_VERTICES
      )

      GLES20.glEnableVertexAttribArray(aTexCoordsLoc)
      GLES20.glVertexAttribPointer(
        aTexCoordsLoc, 2, GLES20.GL_FLOAT, false, 0,
        TEX_VERTICES
      )

      // Set the input texture
      GLES20.glActiveTexture(GLES20.GL_TEXTURE0)
      GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, texture)
      GLES20.glUniform1i(uTexSamplerLoc, 0)

      // Set the mask texture
      GLES20.glActiveTexture(GLES20.GL_TEXTURE1)
      GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, maskTexture)
      GLES20.glUniform1i(uMaskTexSamplerLoc, 1)

      // Draw
      GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4)
    }

    fun release() {
      GLES20.glDeleteProgram(program)
    }

    companion object {
      private const val VERTEX_SHADER = """
      attribute vec4 aFramePosition;
      attribute vec2 aTexCoords;
      varying vec2 vTexCoords;
      void main() {
       gl_Position = aFramePosition;
       vTexCoords = aTexCoords.xy;
      }
    """

      private const val FRAGMENT_SHADER = """
      precision mediump float;
      uniform sampler2D uTexSampler;
      uniform sampler2D uMaskTexSampler;
      varying vec2 vTexCoords;
      void main() {
        vec4 texColor = texture2D(uTexSampler, vTexCoords);
        vec4 maskTexColor = texture2D(uMaskTexSampler, vTexCoords);
        vec4 transparentColor = vec4(0.0, 0.0, 0.0, 0.0);
        gl_FragColor = mix(transparentColor, texColor, maskTexColor.r * maskTexColor.a);
      }
    """

      private val POS_VERTICES = ShaderUtils.floatBuffer(
        -1f, -1f, 0f, 1f,
        1f, -1f, 0f, 1f,
        -1f, 1f, 0f, 1f,
        1f, 1f, 0f, 1f
      )

      private val TEX_VERTICES = ShaderUtils.floatBuffer(
        0f, 0f,
        1f, 0f,
        0f, 1f,
        1f, 1f,
      )
    }
  }
}


