package com.azzapp.bufferloader;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

abstract class AzzappRNBufferLoaderSpec extends ReactContextBaseJavaModule {
  AzzappRNBufferLoaderSpec(ReactApplicationContext context) {
    super(context);
  }

  public abstract boolean install();
}