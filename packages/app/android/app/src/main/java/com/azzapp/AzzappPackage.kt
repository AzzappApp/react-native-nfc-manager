package com.azzapp

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext


class AzzappPackage : ReactPackage {

  override fun createViewManagers(
    reactContext: ReactApplicationContext
  ) = listOf(
    AZPMediaVideoRendererManager(reactContext),
    AZPMediaImageRendererManager(reactContext),
    AZPEditableImageManager(reactContext),
    AZPEditableVideoManager(reactContext)
  )

  override fun createNativeModules(
    reactContext: ReactApplicationContext
  ): MutableList<NativeModule> = listOf(AZPMediaHelper(reactContext)).toMutableList()
}
