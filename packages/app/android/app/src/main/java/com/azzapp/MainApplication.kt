package com.azzapp

import android.app.Application
import android.content.Context
import androidx.media3.common.util.UnstableApi
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.flipper.ReactNativeFlipper
import com.facebook.soloader.SoLoader
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper


class MainApplication : Application(), ReactApplication {

  companion object {
    private var instance: MainApplication? = null

    fun getMainApplicationContext(): Context {
      return instance!!.applicationContext
    }
  }


  override fun onCreate() {
    super.onCreate()
    instance = this;
    SoLoader.init(this, false)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }
    ReactNativeFlipper.initializeFlipper(this, reactNativeHost.reactInstanceManager)

    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  override val reactNativeHost: ReactNativeHost =
    @UnstableApi object : DefaultReactNativeHost(this) {
      override fun getPackages(): List<ReactPackage> {
        val packages =  PackageList(this).packages

        packages.add(AzzappPackage())

        return packages
      }

      override fun getJSMainModuleName(): String = "index"

      override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

      override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
    }

  override val reactHost: ReactHost
    get() =  getDefaultReactHost(this.applicationContext, ReactNativeHostWrapper(this, reactNativeHost))

}