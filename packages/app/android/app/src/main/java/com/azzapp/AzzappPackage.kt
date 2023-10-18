package com.azzapp

import androidx.media3.common.util.UnstableApi
import com.azzapp.gpu.GPUHelpers
import com.azzapp.gpu.GPUImageViewManager
import com.azzapp.gpu.GPUVideoViewManager
import com.azzapp.media.MediaHelpers
import com.azzapp.media.MediaImageRendererManager
import com.azzapp.media.MediaVideoRendererManager
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext


@UnstableApi class AzzappPackage : ReactPackage {

  override fun createViewManagers(
    reactContext: ReactApplicationContext
  ) = listOf(
    MediaVideoRendererManager(reactContext),
    MediaImageRendererManager(reactContext),
    GPUImageViewManager(reactContext),
    GPUVideoViewManager(reactContext)
  )

  override fun createNativeModules(
    reactContext: ReactApplicationContext
  ): MutableList<NativeModule> = listOf(
    MediaHelpers(reactContext),
    GPUHelpers(reactContext)
  ).toMutableList()
}
