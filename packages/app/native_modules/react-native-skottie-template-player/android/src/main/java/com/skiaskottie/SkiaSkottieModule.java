package com.skiaskottie;

import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = SkiaSkottieModule.NAME)
public class SkiaSkottieModule extends ReactContextBaseJavaModule {
  public static final String NAME = "SkiaSkottie";

  public SkiaSkottieModule(ReactApplicationContext context) {
    super(context);
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public boolean install() {
    try {
      System.loadLibrary("react-native-skottie-template-player");
      ReactApplicationContext context = getReactApplicationContext();

      initialize(context.getJavaScriptContextHolder().get());

      Log.i(NAME, "Initialized skia skottie!");
      return true;
    } catch (Exception exception) {
      Log.e(NAME, "Failed to initialize skia skottie!", exception);
      return false;
    }
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  public static native void initialize(long jsiPtr);
}
