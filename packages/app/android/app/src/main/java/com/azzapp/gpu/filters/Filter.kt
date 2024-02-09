package com.azzapp.gpu.filters

import com.azzapp.gpu.utils.FrameBufferPool
import com.azzapp.gpu.utils.GLFrame
import com.azzapp.gpu.utils.GLFramePool

interface Filter<TParameters> {
  fun draw(parameters: TParameters, glFramePool: GLFramePool, frameBufferPool: FrameBufferPool): GLFrame

  fun release()
}