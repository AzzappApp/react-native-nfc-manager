package com.azzapp.gpu.utils

import android.opengl.GLES20

class GLProgram(private var vertexShader: String, private var fragmentShader: String) {
  private var initialized = false
  private var program = -1
  private var attribLocations = mutableMapOf<String, Int>()
  private var uniformLocations = mutableMapOf<String, Int>()

  fun use() {
    if (!initialized) {
      program = GLESUtils.createProgram(
        vertexShader,
        fragmentShader
      )
      GLESUtils.checkGlError("createProgram")
    }
    GLES20.glUseProgram(program)
    GLESUtils.checkGlError("glUseProgram")
  }

  fun getAttribLocation(name: String): Int {
    var location = attribLocations[name]
    if (location == null) {
      location = GLES20.glGetAttribLocation(
        program,
        name
      )
      GLESUtils.checkGlError("glGetAttribLocation")
      attribLocations[name] = location
    }
    return location
  }

  fun getUniformLocation(name: String): Int {
    var location = uniformLocations[name]
    if (location == null) {
      location = GLES20.glGetUniformLocation(
        program,
        name
      )
      GLESUtils.checkGlError("glGetUniformLocation")
      uniformLocations[name] = location
    }
    return location
  }

  fun release() {
    GLESUtils.checkGlError("GLES20.glDeleteProgram")
    GLES20.glDeleteProgram(program)
  }
}