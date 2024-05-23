#include <jni.h>
#include <jsi/jsi.h>
#include "BufferLoader.h"

using namespace facebook;
using namespace azzapp;

void install(jsi::Runtime& jsiRuntime) {
  jsi::Object wrapper = jsi::Object(jsiRuntime);

  wrapper.setProperty(
      jsiRuntime, "BufferLoader",
      jsi::Object::createFromHostObject(
          jsiRuntime, std::make_shared<BufferLoaderHostObject>(jsiRuntime)));

  jsiRuntime.global().setProperty(jsiRuntime, "AZPJSIModules", wrapper);
}

extern "C"
JNIEXPORT void JNICALL
Java_com_azzapp_AZPJSIModulesInstaller_nativeInstall(JNIEnv *env, jobject thiz, jlong jsiPtr) {
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