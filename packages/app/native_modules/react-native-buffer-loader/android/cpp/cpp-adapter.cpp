#include <jni.h>
#include <jsi/jsi.h>
#include "BufferLoader.h"

using namespace facebook;
using namespace azzapp;

void install(jsi::Runtime& jsiRuntime) {
  jsiRuntime.global().setProperty(
      jsiRuntime, "Azzapp_RNBufferLoader",
      jsi::Object::createFromHostObject(
          jsiRuntime, std::make_shared<BufferLoaderHostObject>(jsiRuntime)));
}

extern "C"
JNIEXPORT void JNICALL
Java_com_azzapp_bufferloader_AzzappRNBufferLoaderModule_nativeInstall(JNIEnv *env, jobject thiz, jlong jsiPtr) {
  auto runtime = reinterpret_cast<jsi::Runtime*>(jsiPtr);
  if (runtime) {
    install(*runtime);
  }
}


jint JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, [] {
    JBufferLoader::registerNatives();
  });
}
