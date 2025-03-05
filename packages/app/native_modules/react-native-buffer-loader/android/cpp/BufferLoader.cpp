
#include "BufferLoader.h"
#include "JNIHelpers.h"
#include <android/log.h>
#include <EGL/egl.h>
#include <GLES/gl.h>
#include <map>
#include <thread>

#define GR_GL_RGBA8 0x8058

namespace azzapp {

jni::local_ref<JBufferLoader> JBufferLoader::create(jlong bufferLoader) {
  return newInstance(bufferLoader);
}


void JBufferLoader::registerNatives() {
  javaClassStatic()->registerNatives(
      {makeNativeMethod("postTaskResult", JBufferLoader::postTaskResult)});
}

std::string JBufferLoader::loadImage(std::string uri, double width, double height) {
  static const auto loadImageMethod =
      getClass()->getMethod<jstring (std::string, jdouble, jdouble)>("loadImage");
  return loadImageMethod(self(), uri, width, height)->toStdString();
}

std::string JBufferLoader::loadVideoFrame(std::string uri, double width, double height, double time) {
  static const auto loadVideoFrameMethod =
      getClass()->getMethod<jstring (std::string, double, double, double)>("loadVideoFrame");
  return loadVideoFrameMethod(self(), uri, width, height, time)->toStdString();
}

void JBufferLoader::postTaskResult(jni::alias_ref<jni::JClass>, jlong bufferLoaderPtr,
                                   std::string taskId, jint textureId, jint width, jint height,
                                   std::string errorMessage) {
  auto receiver = reinterpret_cast<BufferLoaderHostObject*>(bufferLoaderPtr);
  receiver->handleTaskResult(taskId, textureId, width, height, errorMessage);
}

void JBufferLoader::releaseTexture(int texId) {
  static const auto releaseTextureMethod =
      getClass()->getMethod<void(jint)>("releaseTexture");
  releaseTextureMethod(self(), texId);
}

BufferLoaderHostObject::BufferLoaderHostObject(jsi::Runtime &runtime) {
  jbufferLoader = jni::make_global(JBufferLoader::create((jlong)this));
  this->runtime = &runtime;
}

std::vector<jsi::PropNameID> BufferLoaderHostObject::getPropertyNames(jsi::Runtime& rt) {
  std::vector<jsi::PropNameID> result;
  result.push_back(
      jsi::PropNameID::forUtf8(rt, std::string("loadImage")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("loadVideoFrame")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("unrefTexture")));
  return result;
}

jsi::Value BufferLoaderHostObject::get(jsi::Runtime& runtime,
                                       const jsi::PropNameID& propNameId) {
  auto propName = propNameId.utf8(runtime);
  if (propName == "loadImage") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forAscii(runtime, "loadImage"), 2,
        [this](jsi::Runtime &runtime, const jsi::Value &thisValue,
               const jsi::Value *arguments, size_t count) -> jsi::Value {
          auto uri = arguments[0].asString(runtime).utf8(runtime);
          double width = 0;
          double height = 0;
          if (arguments[1].isObject()) {
            auto size = arguments[1].asObject(runtime);
            width = size.getProperty(runtime, "width").asNumber();
            height = size.getProperty(runtime, "height").asNumber();
          }
          auto callback = std::make_shared<jsi::Function>(
              arguments[2].asObject(runtime).asFunction(runtime));

          auto taskId = jbufferLoader->loadImage(uri, width, height);
          tasks[taskId] = callback;

          return jsi::Value::undefined();
        });
  } else if (propName == "loadVideoFrame") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forAscii(runtime, "loadVideoFrame"), 3,
        [this](jsi::Runtime &runtime, const jsi::Value &thisValue,
               const jsi::Value *arguments, size_t count) -> jsi::Value {
          auto uri = arguments[0].asString(runtime).utf8(runtime);
          auto time = arguments[1].asNumber();
          double width = 0;
          double height = 0;
          if (arguments[2].isObject()) {
            auto size = arguments[2].asObject(runtime);
            width = size.getProperty(runtime, "width").asNumber();
            height = size.getProperty(runtime, "height").asNumber();
          }
          auto callback = std::make_shared<jsi::Function>(
              arguments[3].asObject(runtime).asFunction(runtime));

          auto taskId = jbufferLoader->loadVideoFrame(uri, width, height, time);
          tasks[taskId] = callback;
          return jsi::Value::undefined();
        });
  } else if (propName == "unrefTexture") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forAscii(runtime, "unrefTexture"), 1,
        [this](jsi::Runtime &runtime, const jsi::Value &thisValue,
           const jsi::Value *arguments, size_t count) -> jsi::Value {
          try {
            auto texture = arguments[0].asObject(runtime);
            int textureId = (int)texture.getProperty(runtime, "glID").asNumber();
            jbufferLoader->releaseTexture(textureId);
          } catch(...) {
            __android_log_print(
                ANDROID_LOG_DEBUG, "BufferLoaderHostObject",
                "unrefBuffer failed to release");
          }
          return jsi::Value::undefined();
        });
  }
  return jsi::Value::undefined();
}

void BufferLoaderHostObject::handleTaskResult(const std::string& taskId, int texId,
                                              int width, int height, std::string errorMessage) {
  if (tasks.count(taskId) == 0) {
    return;
  }
  auto callback = tasks[taskId];
  tasks.erase(taskId);
  JNIHelpers::getCallInvoker()->invokeAsync([=]() {
    if (!errorMessage.empty()) {
      auto error = jsi::Object(*runtime);
      error.setProperty(
        *runtime, "message",
        jsi::String::createFromUtf8(*runtime, errorMessage));
      callback->call(*runtime, error, jsi::Value::null());
    } else {
      jsi::Object jsiTextureInfo = jsi::Object(*runtime);
      jsiTextureInfo.setProperty(*runtime, "glTarget", (int)GL_TEXTURE_2D);
      jsiTextureInfo.setProperty(*runtime, "glFormat", (int)GR_GL_RGBA8);
      jsiTextureInfo.setProperty(*runtime, "glID", texId);
      jsiTextureInfo.setProperty(*runtime, "glProtected", 0);
      callback->call(*runtime, jsi::Value::null(), jsiTextureInfo, width, height);
    }
  });
}


}