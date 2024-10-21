package com.azzapp

import androidx.media3.common.util.UnstableApi
import com.azzapp.media.MediaHelpers
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager


@UnstableApi class AzzappPackage : ReactPackage {

  override fun createViewManagers(
    reactContext: ReactApplicationContext
  ): List<ViewManager<*, *>> = emptyList()

  override fun createNativeModules(
    reactContext: ReactApplicationContext
  ): MutableList<NativeModule> = listOf(
    AZPJSIModulesInstaller(reactContext),
    MediaHelpers(reactContext)
  ).toMutableList()
}
