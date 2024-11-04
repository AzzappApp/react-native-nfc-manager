package com.azzapp.bufferloader;

import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;

public class AzzappRNBufferLoaderModule extends com.azzapp.bufferloader.AzzappRNBufferLoaderSpec {
  public static final String NAME = "AzzappRNBufferLoader";

  private static ReactApplicationContext reactApplicationContext;

  public static ReactApplicationContext currentReactApplicationContext() {
    return reactApplicationContext;
  }

  AzzappRNBufferLoaderModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public boolean install() {
    reactApplicationContext = getReactApplicationContext();
    System.loadLibrary("azzapp_react-native-buffer-loader");
    JavaScriptContextHolder jsContext = getReactApplicationContext().getJavaScriptContextHolder();
    if (jsContext == null) {
      Log.e(NAME, "Failed to install react-native-skia JSI Bindings!");
      return false;
    }
    nativeInstall(jsContext.get());
    return true;
  }

  private native void nativeInstall(long jsiPtr);
}