package com.azzapp.gpu

import android.opengl.GLES20

class FrameBufferPool {

  private val frameBuffers = mutableMapOf<Int, Boolean>()

  fun getFrameBuffer(): Int {
    var frameBuffer: Int? = null
    for ((buffer, available) in frameBuffers) {
      if (available) {
        frameBuffer = buffer
        break;
      }
    }
    if (frameBuffer == null) {
      frameBuffer = ShaderUtils.createFrameBuffer()
    }
    frameBuffers[frameBuffer] = false
    return frameBuffer
  }

  fun releaseFrameBuffer(frameBuffer: Int) {
    if (frameBuffers.contains(frameBuffer)) {
      frameBuffers[frameBuffer] = true
    }
  }

  fun release() {
    frameBuffers.keys.forEach {
      ShaderUtils.disposeFrameBuffer(it)
    }
    frameBuffers.clear()
  }


  private class RecyclableGLFrame(
    override val texture: Int,
    private val onRelease: () -> Unit): GLFrame {
    override var x: Int = 0

    override var y: Int = 0

    override var width: Int = 0

    override var height: Int = 0

    override fun release() {
      onRelease()
    }
  }

}