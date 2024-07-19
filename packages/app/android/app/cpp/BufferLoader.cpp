
#include "BufferLoader.h"
#include "JNIHelpers.h"
#include <android/log.h>
#include <map>
#include <thread>

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
                                     std::string taskId, jni::alias_ref<jobject> jbuffer,
                                     std::string errorMessage) {
  auto receiver = reinterpret_cast<BufferLoaderHostObject*>(bufferLoaderPtr);
  AHardwareBuffer* buffer = nullptr;
  if (jbuffer != nullptr) {
    buffer = AHardwareBuffer_fromHardwareBuffer(
        jni::Environment::current(), jbuffer.get());
  }
  receiver->handleTaskResult(taskId, buffer, errorMessage);
}

void JBufferLoader::releaseBuffer(std::string bufferId) {
  static const auto loadVideoFrameMethod =
      getClass()->getMethod<void(std::string)>("releaseBuffer");
  loadVideoFrameMethod(self(), bufferId);
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
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("unrefBuffer")));
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
  } else if (propName == "unrefBuffer") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forAscii(runtime, "unrefBuffer"), 1,
        [this](jsi::Runtime &runtime, const jsi::Value &thisValue,
           const jsi::Value *arguments, size_t count) -> jsi::Value {
          auto bufferAddress = arguments[0].asBigInt(runtime).asUint64(runtime);
          try {
            AHardwareBuffer_release(reinterpret_cast<AHardwareBuffer *>(bufferAddress));
          } catch(...) {
            __android_log_print(
                ANDROID_LOG_DEBUG, "BufferLoaderHostObject",
                "unrefBuffer failed to release");
          }
          if (buffers.count(bufferAddress) > 0) {
            auto taskId = buffers[bufferAddress];
            jbufferLoader->releaseBuffer(taskId);
          }
          return jsi::Value::undefined();
        });
  }
  return jsi::Value::undefined();
}

void BufferLoaderHostObject::handleTaskResult(std::string taskId, AHardwareBuffer *buffer,
                                              std::string errorMessage) {
  if (tasks.count(taskId) == 0) {
    return;
  }
  auto callback = tasks[taskId];
  tasks.erase(taskId);
  uintptr_t bufferAddress = -1;
  if (buffer == nullptr) {
    if (errorMessage.size() == 0) {
      errorMessage = "Failed to retrieve buffer";
    }
  } else {
    AHardwareBuffer_acquire(buffer);
    bufferAddress = reinterpret_cast<uintptr_t>(buffer);
    buffers[bufferAddress] = taskId;
  }
  JNIHelpers::getCallInvoker()->invokeAsync([=]() {
    if (bufferAddress == -1) {
      auto error = jsi::Object(*runtime);
      error.setProperty(
        *runtime, "message",
        jsi::String::createFromUtf8(*runtime, errorMessage));
      callback->call(*runtime, error, jsi::Value::null());
    } else {
      auto jsBuffer = jsi::BigInt::fromUint64(*runtime, bufferAddress);
      callback->call(*runtime, jsi::Value::null(), jsBuffer);
    }
  });
}


}