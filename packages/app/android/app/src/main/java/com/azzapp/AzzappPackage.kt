package com.azzapp

import com.azzapp.media.MediaHelpers
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager


class AzzappPackage : ReactPackage {

  override fun createViewManagers(
    reactContext: ReactApplicationContext
  ): List<ViewManager<*, *>> = emptyList()

  override fun createNativeModules(
    reactContext: ReactApplicationContext
  ): MutableList<NativeModule> = listOf(
    MediaHelpers(reactContext)
  ).toMutableList()
}
