package com.azzapp.bufferloader;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.TurboReactPackage;

import java.util.HashMap;
import java.util.Map;

public class AzzappRNBufferLoaderPackage extends TurboReactPackage {

  @Nullable
  @Override
  public NativeModule getModule(String name, ReactApplicationContext reactContext) {
    if (name.equals(AzzappRNBufferLoaderModule.NAME)) {
      return new AzzappRNBufferLoaderModule(reactContext);
    } else {
      return null;
    }
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return () -> {
      final Map<String, ReactModuleInfo> moduleInfos = new HashMap<>();
      boolean isTurboModule = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
      moduleInfos.put(
        AzzappRNBufferLoaderModule.NAME,
        new ReactModuleInfo(
          AzzappRNBufferLoaderModule.NAME,
          AzzappRNBufferLoaderModule.NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          true, // hasConstants
          false, // isCxxModule
          isTurboModule // isTurboModule
        ));
      return moduleInfos;
    };
  }
}