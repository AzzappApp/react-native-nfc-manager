package com.azzapp.gpu.filters

class FilterFactory {
  private val filters = mutableMapOf<String, Filter<*>>()

  fun <P>getFilter(name: String): Filter<P> {
    var filter: Filter<P>? = filters[name] as Filter<P>?
    if (filter == null) {
      val factory = filtersFactory[name] ?: throw Error("Unregistred filter : $name")
      filter = factory() as Filter<P>
      filters[name] = filter
    }
    return filter
  }

  fun release() {
    filters.forEach { (_, value) -> value.release() }
    filters.clear()
  }

  companion object {
    private val filtersFactory = mutableMapOf<String, () -> Filter<*>>()

    fun registerFilter(name: String, factory: () -> Filter<*>) {
      filtersFactory[name] = factory
    }

    init {
      registerFilter(BlendFilter.NAME) {
        BlendFilter()
      }
      registerFilter(BrightnessFilter.NAME) {
        BrightnessFilter()
      }
      registerFilter(ColorLUTFilter.NAME) {
        ColorLUTFilter()
      }
      registerFilter(CompositeOverFilter.NAME) {
        CompositeOverFilter()
      }
      registerFilter(ContrastFilter.NAME) {
        ContrastFilter()
      }
      registerFilter(CropFilter.NAME) {
        CropFilter()
      }
      registerFilter(OrientationFilter.NAME) {
        OrientationFilter()
      }
      registerFilter(RotationFilter.NAME) {
        RotationFilter()
      }
      registerFilter(SaturationFilter.NAME) {
        SaturationFilter()
      }
      registerFilter(SharpenFilter.NAME) {
        SharpenFilter()
      }
      registerFilter(TemperatureFilter.NAME) {
        TemperatureFilter()
      }
      registerFilter(TintFilter.NAME) {
        TintFilter()
      }
      registerFilter(VignetteFilter.NAME) {
        VignetteFilter()
      }
    }
  }
}