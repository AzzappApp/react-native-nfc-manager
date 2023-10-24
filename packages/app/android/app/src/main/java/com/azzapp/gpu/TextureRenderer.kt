package com.azzapp.gpu

import android.opengl.GLES11Ext
import android.opengl.GLES20

class TextureRenderer(
  private val external: Boolean,
  private val flipTexY: Boolean = false
) {
  var program = 0
  var aFramePositionLoc = 0
  var aTexCoordsLoc = 0
  var uTexTransformLoc = 0
  var uTexSamplerLoc = 0


  init {
    // Create program
    program = ShaderUtils.createProgram(
      VERTEX_SHADER,
      if (external) FRAGMENT_SHADER_EXTERNAL else FRAGMENT_SHADER
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
    uTexTransformLoc = GLES20.glGetUniformLocation(
      program,
      "uTexTransform"
    )

    uTexSamplerLoc = GLES20.glGetUniformLocation(
      program,
      "uTexSampler"
    )

  }

  fun renderTexture(
    texture: Int,
    transformMatrix: FloatArray,
    x: Int,
    y: Int,
    width: Int,
    height: Int,
    frameBuffer: Int? = null
  ) {
    GLES20.glBindFramebuffer(GLES20.GL_FRAMEBUFFER, frameBuffer ?: 0)
    GLES20.glUseProgram(program)
    GLES20.glViewport(x, y, width, height)

    GLES20.glUniformMatrix4fv(uTexTransformLoc, 1, false, transformMatrix, 0)

    GLES20.glEnableVertexAttribArray(aFramePositionLoc)
    GLES20.glVertexAttribPointer(
      aFramePositionLoc, 4, GLES20.GL_FLOAT, false, 0,
      POS_VERTICES
    )

    GLES20.glEnableVertexAttribArray(aTexCoordsLoc)
    GLES20.glVertexAttribPointer(
      aTexCoordsLoc, 4, GLES20.GL_FLOAT, false, 0,
      if (flipTexY) FLIPPED_TEXTURE_VERTICES else TEX_VERTICES
    )

    // Set the input texture
    GLES20.glActiveTexture(GLES20.GL_TEXTURE0)
    if (external) {
      GLES20.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, texture)
    } else {
      GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, texture)
    }
    GLES20.glUniform1i(uTexSamplerLoc, 0)

    // Draw
    GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4)
  }

  fun release() {
    GLES20.glDeleteProgram(program)
  }

  companion object {
    private const val VERTEX_SHADER = """
      attribute vec4 aFramePosition;
      attribute vec4 aTexCoords;
      uniform mat4 uTexTransform;
      varying vec2 vTexCoords;
      void main() {
       gl_Position = aFramePosition;
       vTexCoords = (uTexTransform * aTexCoords).xy;
      }
    """


    private const val FRAGMENT_SHADER = """
      precision mediump float;
      uniform sampler2D uTexSampler;
      varying vec2 vTexCoords;
      void main() {
        gl_FragColor = texture2D(uTexSampler, vTexCoords);
      }
    """

    private const val FRAGMENT_SHADER_EXTERNAL = """
      #extension GL_OES_EGL_image_external : require
      precision mediump float;
      uniform samplerExternalOES uTexSampler;
      varying vec2 vTexCoords;
      void main() {
        gl_FragColor = texture2D(uTexSampler, vTexCoords);
      }
    """

    private val POS_VERTICES = ShaderUtils.floatBuffer(
      -1f, -1f, 0f, 1f,
      1f, -1f, 0f, 1f,
      -1f, 1f, 0f, 1f,
      1f, 1f, 0f, 1f
    )

    private val TEX_VERTICES = ShaderUtils.floatBuffer(
      0f, 0f, 0f, 1f,
      1f, 0f, 0f, 1f,
      0f, 1f, 0f, 1f,
      1f, 1f, 0f, 1f
    )

    private val FLIPPED_TEXTURE_VERTICES = ShaderUtils.floatBuffer(
      0f, 1f, 0f, 1f,
      1f, 1f, 0f, 1f,
      0f, 0f, 0f, 1f,
      1f, 0f, 0f, 1f,
    )

    private const val FLOAT_SIZE_BYTES = 4
  }
}
