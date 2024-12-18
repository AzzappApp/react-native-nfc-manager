package com.azzapp.bufferloader;


public class JNIHelpers {
  static public Object getCallInvoker() {
    return AzzappRNBufferLoaderModule.currentReactApplicationContext()
      .getCatalystInstance().getJSCallInvokerHolder();
  }
}
