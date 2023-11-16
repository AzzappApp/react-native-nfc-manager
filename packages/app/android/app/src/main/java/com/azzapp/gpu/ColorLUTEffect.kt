package com.azzapp.gpu

import android.opengl.GLES20

class ColorLUTEffect {

  private var frameBuffer: Int? = null

  private var colorLutRenderer: ColorLutRenderer = ColorLutRenderer()

  fun apply(inputImage: GLFrame, colorLutImage: GLFrame): GLFrame? {
    if (frameBuffer == null) {
      frameBuffer = ShaderUtils.createFrameBuffer()
    }
    val frameBuffer = frameBuffer ?: return null

    val outputFrame = GLFrame.create()
    ShaderUtils.bindRGBATexture(
      outputFrame.texture,
      inputImage.width,
      inputImage.height,
    )
    outputFrame.width = inputImage.width
    outputFrame.height = inputImage.height

    GLES20.glBindFramebuffer(GLES20.GL_FRAMEBUFFER, frameBuffer)
    GLES20.glFramebufferTexture2D(
      GLES20.GL_FRAMEBUFFER,
      GLES20.GL_COLOR_ATTACHMENT0,
      GLES20.GL_TEXTURE_2D,
      outputFrame!!.texture,
      0
    )
    colorLutRenderer.apply(
      inputImage.texture,
      colorLutImage.texture,
      0,
      0,
      inputImage.width,
      inputImage.height
    )

    return outputFrame
  }

  fun release() {
    colorLutRenderer.release()
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



  class ColorLutRenderer {
    var program = 0
    var aFramePositionLoc = 0
    var aTexCoordsLoc = 0
    var uColorLutSamplerLoc = 0
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

      uColorLutSamplerLoc = GLES20.glGetUniformLocation(
        program,
        "uColorLutSampler"
      )

      uTexSamplerLoc = GLES20.glGetUniformLocation(
        program,
        "uTexSampler"
      )
    }

    fun apply(
      texture: Int,
      lutTexture: Int,
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

      GLES20.glActiveTexture(GLES20.GL_TEXTURE1)
      GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, lutTexture)
      GLES20.glUniform1i(uColorLutSamplerLoc, 1)


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
        precision highp float;
        uniform sampler2D uTexSampler;
        uniform sampler2D uColorLutSampler;
        varying vec2 vTexCoords;
        
        const float lutSize = 64.0;
        
        vec4 getLutColor(float x, float y, float z) {
          float imageSize = sqrt(lutSize * lutSize * lutSize);
          float lineIndex = floor(y / sqrt(lutSize));
          float rectIndex = y - lineIndex * sqrt(lutSize);
         
          vec2 coords = vec2(
             (x + rectIndex * lutSize + 0.5) / imageSize,
             (z * sqrt(lutSize) + lineIndex + 0.5)  / imageSize
          );
 
          vec4 lutColor = texture2D(
            uColorLutSampler,
            coords
          );
          
          return lutColor;
        }
        
        void main() {
            
            vec4 textureColor = texture2D(uTexSampler, vTexCoords);
            
            float x = textureColor.r * (lutSize - 1.0);
            float y = textureColor.g * (lutSize - 1.0);
            float z = textureColor.b * (lutSize - 1.0);
            
            vec4 lutColor = mix( 
              mix(
                mix(
                  getLutColor(floor(x), floor(y), floor(z)),
                  getLutColor(ceil(x), floor(y), floor(z)),
                  fract(x)
                ),
                mix(
                  getLutColor(floor(x), ceil(y), floor(z)),
                  getLutColor(ceil(x), ceil(y), floor(z)),
                  fract(x)
                ),
                fract(y)
              ),
              mix(
                mix(
                  getLutColor(floor(x), floor(y), ceil(z)),
                  getLutColor(ceil(x), floor(y), ceil(z)),
                  fract(x)
                ),
                mix(
                  getLutColor(floor(x), ceil(y), ceil(z)),
                  getLutColor(ceil(x), ceil(y), ceil(z)),
                  fract(x)
                ),
                fract(y)
              ), 
              fract(z)
            );
        
            gl_FragColor = vec4(lutColor.rgb, textureColor.a);
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


