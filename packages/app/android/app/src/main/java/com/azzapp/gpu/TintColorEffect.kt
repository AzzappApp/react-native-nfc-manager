package com.azzapp.gpu

import android.opengl.GLES20

class TintColorEffect {

  private var frameBuffer: Int? = null

  private var tintRenderer: TintColorRenderer = TintColorRenderer()

  fun apply(inputImage: GLFrame, tintColor: Int): GLFrame? {
    if (frameBuffer == null) {
      frameBuffer = ShaderUtils.createFrameBuffer()
    }
    val frameBuffer = frameBuffer ?: return null



    GLES20.glBindFramebuffer(GLES20.GL_FRAMEBUFFER, frameBuffer)

    val outputFrame = GLFrame.create()
    ShaderUtils.bindRGBATexture(
      outputFrame.texture,
      inputImage.width,
      inputImage.height,
    )
    outputFrame.x = inputImage.x
    outputFrame.y = inputImage.y
    outputFrame.width = inputImage.width
    outputFrame.height = inputImage.height

    GLES20.glFramebufferTexture2D(
      GLES20.GL_FRAMEBUFFER,
      GLES20.GL_COLOR_ATTACHMENT0,
      GLES20.GL_TEXTURE_2D,
      outputFrame!!.texture,
      0
    )
    tintRenderer.apply(
      inputImage.texture,
      tintColor,
      inputImage.x, inputImage.y,
      inputImage.width,
      inputImage.height
    )

    return outputFrame
  }

  fun release() {
    tintRenderer.release()
    val frameBuffer = frameBuffer?: return
    ShaderUtils.disposeFrameBuffer(frameBuffer)
  }

  companion object  {
    private const val GL_STATE_FBO = 0
    private const val GL_STATE_PROGRAM = 1
    private const val GL_STATE_ARRAYBUFFER = 2
    private const val GL_STATE_COUNT = 3
  }

  private val mOldState = IntArray(GL_STATE_COUNT)



  class TintColorRenderer {
    var program = 0
    var aFramePositionLoc = 0
    var aTexCoordsLoc = 0
    var uTintColor = 0
    var uTexSamplerLoc = 0


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

      uTintColor  = GLES20.glGetUniformLocation(
        program,
        "uTintColor"
      )

      uTexSamplerLoc = GLES20.glGetUniformLocation(
        program,
        "uTexSampler"
      )
    }

    fun apply(
      texture: Int,
      tintColor: Int,
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

      GLES20.glActiveTexture(GLES20.GL_TEXTURE0)
      GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, texture)

      GLES20.glUniform1i(uTexSamplerLoc, 0)

      var colorFloat =  FloatArray(3)
      colorFloat[0] = (tintColor shr 16 and 0xff) / 255.0f;
      colorFloat[1] =  (tintColor shr 8 and 0xff) / 255.0f;
      colorFloat[2] = (tintColor and 0xff) / 255.0f;
      GLES20.glUniform3fv(uTintColor, 1, colorFloat, 0)

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
      uniform vec3 uTintColor;
      varying vec2 vTexCoords;
      void main() {
        vec4 texColor = texture2D(uTexSampler, vTexCoords);
        gl_FragColor = vec4(uTintColor.r, uTintColor.g, uTintColor.b, texColor.a);
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


