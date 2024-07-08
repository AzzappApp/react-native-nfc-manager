package com.azzapp

import androidx.media3.common.util.UnstableApi
import com.azzapp.media.MediaHelpers
import com.azzapp.snapshot.AZPSnapshotManager
import com.azzapp.snapshot.AZPSnapshotModule
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager


@UnstableApi class AzzappPackage : ReactPackage {

  override fun createViewManagers(
    reactContext: ReactApplicationContext
  ): List<ViewManager<*, *>> = listOf(AZPSnapshotManager())

  override fun createNativeModules(
    reactContext: ReactApplicationContext
  ): MutableList<NativeModule> = listOf(
    AZPJSIModulesInstaller(reactContext),
    MediaHelpers(reactContext),
    AZPSnapshotModule(reactContext)
  ).toMutableList()
}
