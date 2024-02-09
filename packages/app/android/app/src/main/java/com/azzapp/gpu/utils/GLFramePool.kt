package com.azzapp.gpu.utils

import android.opengl.GLES20

class GLFramePool {
  private val textures = mutableMapOf<Int, Boolean>()

  fun getGlFrame(): GLFrame {
    var texture: Int? = null
    for ((tex, available) in textures) {
      if (available) {
        texture = tex
        break;
      }
    }
    if (texture == null) {
      texture = GLESUtils.createTexture()
    }
    textures[texture] = false
    return GLFrameRef(texture) {
      textures[texture] = true
    }
  }

  fun release() {
    if (textures.isNotEmpty()) {
      GLES20.glDeleteTextures(textures.size, textures.keys.toIntArray(), 0)
    }
    textures.clear()
  }


  private class GLFrameRef(
    override val texture: Int,
    private val onRelease: () -> Unit
  ): GLFrame {
    override var x: Int = 0
    override var y: Int = 0
    override var width: Int = 0
    override var height: Int = 0

    override fun release() {
      onRelease()
    }
  }

}