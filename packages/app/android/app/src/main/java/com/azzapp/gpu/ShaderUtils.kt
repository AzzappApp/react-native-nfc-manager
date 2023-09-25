package com.azzapp.gpu

import android.graphics.Bitmap
import android.opengl.*
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer

internal object ShaderUtils {

  const val EGL_CONTEXT_CLIENT_VERSION = 0x3098

  val IDENT_MATRIX = FloatArray(16)
  init {
    Matrix.setIdentityM(IDENT_MATRIX, 0)
  }

  fun createTexture(): Int {
    val texId = IntArray(1)
    GLES20.glGenTextures(1, texId,  0)
    return texId[0]
  }

  fun bindRGBATexture(texture: Int, width: Int, height: Int) {
    GLES20.glActiveTexture(GLES20.GL_TEXTURE0)
    GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, texture)
    GLES20.glTexImage2D(
      GLES20.GL_TEXTURE_2D,
      0,
      GLES20.GL_RGBA,
      width, height,
      0,
      GLES20.GL_RGBA,
      GLES20.GL_UNSIGNED_BYTE,
      null)
    GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_LINEAR)
    GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR)
    GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE)
    GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE)
  }

  fun bindImageTexture(texture: Int, bitmap: Bitmap) {
    GLES20.glActiveTexture(GLES20.GL_TEXTURE0)
    GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, texture)
    GLUtils.texImage2D(GLES20.GL_TEXTURE_2D, 0, bitmap, 0)
    GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_LINEAR)
    GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR)
    GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE)
    GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE)
  }

  fun bindExternalTexture(texture: Int) {
    GLES20.glActiveTexture(GLES20.GL_TEXTURE0)
    GLES20.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, texture)
    GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_LINEAR)
    GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR)
    GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE)
    GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE)
  }

  fun createFrameBuffer(): Int {
    val frameBuffers = IntArray(1)
    GLES20.glGenFramebuffers(1, frameBuffers,  0)
    return frameBuffers[0]
  }

  fun createProgram(vertexSource: String, fragmentSource: String): Int {
    val vertexShader = loadShader(GLES20.GL_VERTEX_SHADER, vertexSource)
    if (vertexShader == 0) {
      return 0
    }
    val fragmentShared = loadShader(GLES20.GL_FRAGMENT_SHADER, fragmentSource)
    if (fragmentShared == 0) {
      return 0
    }
    val program = GLES20.glCreateProgram()
    if (program != 0) {
      GLES20.glAttachShader(program, vertexShader)
      GLES20.glAttachShader(program, fragmentShared)
      GLES20.glLinkProgram(program)
      val linkStatus = IntArray(1)
      GLES20.glGetProgramiv(
        program, GLES20.GL_LINK_STATUS, linkStatus,
        0
      )
      if (linkStatus[0] != GLES20.GL_TRUE) {
        val info = GLES20.glGetProgramInfoLog(program)
        GLES20.glDeleteProgram(program)
        throw RuntimeException("Could not link program: $info")
      }
    }
    return program
  }

  private fun loadShader(shaderType: Int, source: String): Int {
    val shader = GLES20.glCreateShader(shaderType)
    if (shader != 0) {
      GLES20.glShaderSource(shader, source)
      GLES20.glCompileShader(shader)
      val compiled = IntArray(1)
      GLES20.glGetShaderiv(shader, GLES20.GL_COMPILE_STATUS, compiled, 0)
      if (compiled[0] == 0) {
        val info = GLES20.glGetShaderInfoLog(shader)
        GLES20.glDeleteShader(shader)
        throw RuntimeException("Could not compile shader $shaderType:$info")
      }
    }
    return shader
  }

  /**
   * Calls [GLES20.glGetError] and raises an exception if there was an error.
   */
  fun checkGlError(msg: String) {
    val error = GLES20.glGetError()
    if (error != GLES20.GL_NO_ERROR) {
      val hexString =  Integer.toHexString(error)
      val description = GLU.gluErrorString(error)
      throw java.lang.RuntimeException("$msg: GL error: 0x$hexString description: $description")
    }
  }


  /**
   * Creates a [FloatBuffer] with the given arguments as contents.
   * The buffer is created in native format for efficient use with OpenGL.
   */
  fun floatBuffer(vararg values: Float): FloatBuffer {
    val byteBuffer: ByteBuffer = ByteBuffer.allocateDirect(
      values.size * 4 /* sizeof(float) */
    )
    // use the device hardware's native byte order
    byteBuffer.order(ByteOrder.nativeOrder())

    // create a floating point buffer from the ByteBuffer
    val floatBuffer: FloatBuffer = byteBuffer.asFloatBuffer()
    // add the coordinates to the FloatBuffer
    floatBuffer.put(values)
    // set the buffer to read the first coordinate
    floatBuffer.position(0)
    return floatBuffer
  }


}