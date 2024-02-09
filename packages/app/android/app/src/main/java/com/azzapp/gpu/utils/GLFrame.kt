package com.azzapp.gpu.utils

import android.opengl.GLES20
import java.util.concurrent.atomic.AtomicInteger


interface GLFrame {
  var x: Int
  var y: Int
  var width: Int
  var height: Int
  val texture: Int
  fun release()

  companion object {
    private val imagesMap = mutableMapOf<String, SharedGLFrame>()

    fun create(x: Int, y: Int, width: Int, height: Int): GLFrame {
      return GLFrameImpl(null, x, y, width, height)
    }

    fun create(width: Int, height: Int): GLFrame {
      return GLFrameImpl(null,0, 0, width, height)
    }

    fun create(): GLFrame {
      return GLFrameImpl(null,0, 0, 0, 0)
    }

    fun createWithExistingTexture(texture: Int, width: Int, height: Int): GLFrame {
      return GLFrameImpl(texture, 0, 0, width, height)
    }

    fun sharedFrame(key: String, factory: () -> GLFrame?): GLFrame? {
      var image = imagesMap[key]
      if (image == null) {
        val gpuImage = factory() ?: return null
        image = SharedGLFrame(key, gpuImage)
        imagesMap[key] = image
      }
      image.refCount.incrementAndGet()
      return image
    }

    fun createRef(glFrame: GLFrame): GLFrame {
      return GLFrameImpl(glFrame.texture, glFrame.x, glFrame.y, glFrame.width, glFrame.height)
    }
  }

  private class GLFrameImpl(
    texture: Int?,
    override var x: Int,
    override var y: Int,
    override var width: Int,
    override var height: Int,
  ) : GLFrame {


    private val _texture: Int
    private val ownTexture: Boolean

    init {
      if (texture == null) {
        _texture = GLESUtils.createTexture()
        ownTexture =true;
      }  else {
        _texture = texture;
        ownTexture = false
      }
    }

    override val texture get() = _texture

    override fun release() {
      if (ownTexture) {
        GLES20.glDeleteTextures(1, intArrayOf(_texture), 0)
      }
    }
  }

  private class SharedGLFrame(val key: String, private val frame: GLFrame) : GLFrame {
    override var x: Int
      get() = frame.x
      set(value) {
        frame.x = value
      }

    override var y: Int
      get() = frame.y
      set(value) {
        frame.y = value
      }

    override var width: Int
      get() = frame.width
      set(value) {
        frame.width = value
      }

    override var height: Int
      get() = frame.height
      set(value) {
        frame.height = value
      }

    override val texture: Int
      get() = frame.texture

    val refCount = AtomicInteger(0)

    override fun release() {
      if (refCount.decrementAndGet() <= 0) {
        imagesMap.remove(key)
        frame.release()
      }
    }
  }
}

