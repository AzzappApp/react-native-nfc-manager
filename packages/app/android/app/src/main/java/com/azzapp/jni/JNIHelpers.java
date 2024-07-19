package com.azzapp.jni;

import com.azzapp.AZPJSIModulesInstaller;
import com.azzapp.MainApplication;
import com.facebook.react.bridge.ReactApplicationContext;
import com.shopify.reactnative.skia.RNSkiaModule;

public class JNIHelpers {
  static public Object getCallInvoker() {
    return AZPJSIModulesInstaller.reactApplicationContext
      .getCatalystInstance().getJSCallInvokerHolder();
  }
}
