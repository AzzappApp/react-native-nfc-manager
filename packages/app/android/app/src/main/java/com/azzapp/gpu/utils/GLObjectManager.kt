package com.azzapp.gpu.utils

import com.azzapp.gpu.filters.BlendFilter
import com.azzapp.gpu.filters.BrightnessFilter
import com.azzapp.gpu.filters.ColorLUTFilter
import com.azzapp.gpu.filters.CompositeOverFilter
import com.azzapp.gpu.filters.ContrastFilter
import com.azzapp.gpu.filters.CropFilter
import com.azzapp.gpu.filters.FilterFactory
import com.azzapp.gpu.filters.OrientationFilter
import com.azzapp.gpu.filters.RotationFilter
import com.azzapp.gpu.filters.SaturationFilter
import com.azzapp.gpu.filters.SharpenFilter
import com.azzapp.gpu.filters.TemperatureFilter
import com.azzapp.gpu.filters.TintFilter
import com.azzapp.gpu.filters.VignetteFilter

class GLObjectManager {
  val frameBufferPool = FrameBufferPool()
  val filterFactory = FilterFactory()
  val glFramePool = GLFramePool()


  fun getGlFrame() = glFramePool.getGlFrame()
  fun getFrameBuffer() = frameBufferPool.getFrameBuffer()

  fun releaseFrameBuffer(frameBuffer: Int) = frameBufferPool.releaseFrameBuffer(frameBuffer)

  private fun <TParameters>applyFilter(name: String, params: TParameters) =
    filterFactory.getFilter<TParameters>(name).draw(params, glFramePool, frameBufferPool)


  fun applyBlendFilter(params: BlendFilter.Parameters) = applyFilter(
    BlendFilter.NAME,
    params
  )

  fun applyBrightnessFilter(params: BrightnessFilter.Parameters) = applyFilter(
    BrightnessFilter.NAME,
    params
  )

  fun applyCrop(params: CropFilter.Parameters) = applyFilter(
    CropFilter.NAME,
    params
  )

  fun applyColorLUTFilter(params: ColorLUTFilter.Parameters) = applyFilter(
    ColorLUTFilter.NAME,
    params
  )

  fun applyCompositeOverFilter(params: CompositeOverFilter.Parameters) = applyFilter(
    CompositeOverFilter.NAME,
    params
  )

  fun applyContrastFilter(params: ContrastFilter.Parameters) = applyFilter(
    ContrastFilter.NAME,
    params
  )


  fun applyOrientationFilter(params: OrientationFilter.Parameters) = applyFilter(
    OrientationFilter.NAME,
    params
  )
  fun applySaturationFilter(params: SaturationFilter.Parameters) = applyFilter(
    SaturationFilter.NAME,
    params
  )

  fun applySharpenFilter(params: SharpenFilter.Parameters) = applyFilter(
    SharpenFilter.NAME,
    params
  )

  fun applyRotationFilter(params: RotationFilter.Parameters) = applyFilter(
    RotationFilter.NAME,
    params
  )

  fun applyTemperatureFilter(params: TemperatureFilter.Parameters) = applyFilter(
    TemperatureFilter.NAME,
    params
  )

  fun applyTintFilter(params: TintFilter.Parameters) = applyFilter(
    TintFilter.NAME,
    params
  )

  fun applyVignetteFilter(params: VignetteFilter.Parameters) = applyFilter(
    VignetteFilter.NAME,
    params
  )


  fun release() {
    frameBufferPool.release()
    glFramePool.release()
    filterFactory.release()
  }
}